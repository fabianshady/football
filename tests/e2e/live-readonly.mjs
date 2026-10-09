import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:net'
import { mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { formatDateTimeInZone } from '../../lib/datetime.ts'
import { mapPlayer, mapRawMatch } from '../../lib/matches.ts'
import { playerDisplayName, priorRivalMatches } from '../../lib/public.ts'
import { buildLineupVariants, getFormations, recommendFormation } from '../../lib/tactics.ts'
import sharp from 'sharp'

// Node 22; reuse an externally installed Playwright without adding browser dependencies.
// PLAYWRIGHT_MODULE=/absolute/path/to/node_modules/playwright/index.mjs node --experimental-strip-types tests/e2e/live-readonly.mjs
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
process.loadEnvFile(join(root, '.env'))
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE)).href : 'playwright')
const output = resolve(process.env.LIVE_ARTIFACT_DIR ?? join(tmpdir(), `football-live-${Date.now()}`))
await mkdir(output, { recursive: true })
const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
assert.match(url ?? '', /^https:\/\/.+\.supabase\.co$/, 'A real remote Supabase URL is required')
assert.ok(key, 'A public Supabase key is required')
async function read(table, query = 'select=*') {
  const response = await fetch(`${url}/rest/v1/${table}?${query}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
  assert.equal(response.status, 200, `anonymous read ${table}`)
  return response.json()
}
const [teams, seasons, matches, settingsRows, debts, rawPlayers, rawDetails] = await Promise.all([
  read('team', 'select=*&order=sort_order'), read('season', 'select=*&order=startdate.desc'),
  read('v_match', 'select=*&order=date.desc'), read('club_settings', 'select=*&id=eq.1'),
  read('v_player_debt'), read('Player', 'select=*,player_team(team_id)&order=dorsal'),
  read('Match', 'select=*,Goal(*,Player(*)),MatchSquad(*,Player(*))'),
])
const allPlayers = rawPlayers.map(mapPlayer)
const players = allPlayers.filter((player) => player.active)
const details = new Map(rawDetails.map((raw) => [raw.id, mapRawMatch(raw)]))
assert.ok(teams.some((team) => team.slug === 'itj-fc'), 'Live ITJ slug must be itj-fc')
assert.ok(matches.length, 'Live match evidence is required')
const paths = ['/', '/plantilla', '/finanzas']
for (const team of teams) paths.push(`/${team.slug}`, `/${team.slug}/partidos`, `/${team.slug}/estadisticas`)
const detailMatches = new Map()
for (const team of teams) {
  const rows = matches.filter((match) => match.teamId === team.id)
  for (const match of [rows.find((row) => new Date(row.date) <= new Date()), rows.find((row) => new Date(row.date) > new Date())].filter(Boolean)) detailMatches.set(match.id, match)
  const populated = rows.find((row) => details.get(row.id)?.squad?.length)
  if (populated) detailMatches.set(populated.id, populated)
  const withHistory = rows.find((row) => priorRivalMatches(matches.map(mapRawMatch), mapRawMatch(row), row.teamId).length)
  if (withHistory) detailMatches.set(withHistory.id, withHistory)
}
for (const id of detailMatches.keys()) paths.push(`/partido/${id}`)
for (const player of allPlayers) paths.push(`/plantilla/${encodeURIComponent(player.id)}`)
const servers = []
let browser
const evidence = { remote: new URL(url).hostname, counts: { teams: teams.length, seasons: seasons.length, matches: matches.length, activePlayers: players.length, totalPlayers: allPlayers.length, futureMatches: matches.filter((match) => new Date(match.date) > new Date()).length, detailMatches: detailMatches.size, debtRows: debts.length, settings: settingsRows.length }, pages: [], links: [], admin: [], consoleErrors: [], pageErrors: [], failedRequests: [], cancelledRscRequests: [], blockedWrites: [], assertions: [], artifacts: output }
async function startServer(cwd, port, extraEnv = {}) {
  const probe = createServer()
  await new Promise((done, reject) => { probe.once('error', reject); probe.listen(port, '127.0.0.1', done) })
  await new Promise((done) => probe.close(done))
  const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)], { cwd, env: { ...process.env, NODE_ENV: 'production', VERCEL_ENV: 'production', SITE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1', ...extraEnv }, stdio: ['ignore', 'pipe', 'pipe'] })
  const entry = { child, log: '', cwd }
  servers.push(entry)
  child.stdout.on('data', (chunk) => { entry.log += chunk })
  child.stderr.on('data', (chunk) => { entry.log += chunk })
  for (let i = 0; i < 120; i++) {
    assert.equal(child.exitCode, null, `Next exited: ${entry.log}`)
    try { if ((await fetch(`http://127.0.0.1:${port}`)).status < 500) return `http://127.0.0.1:${port}` } catch {}
    await new Promise((done) => setTimeout(done, 500))
  }
  throw new Error(`Next did not start: ${entry.log}`)
}
async function contextFor(viewport) {
  const context = await browser.newContext({ viewport, timezoneId: 'UTC', colorScheme: 'light' })
  await context.route('**/*', async (route) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(route.request().method())) {
      evidence.blockedWrites.push({ method: route.request().method(), url: route.request().url() })
      return route.abort('blockedbyclient')
    }
    await route.continue()
  })
  const page = await context.newPage()
  page.on('pageerror', (error) => evidence.pageErrors.push({ url: page.url(), message: error.message }))
  page.on('console', (message) => { if (message.type() === 'error') evidence.consoleErrors.push({ url: page.url(), message: message.text() }) })
  page.on('requestfailed', (request) => {
    const failure = { url: request.url(), error: request.failure()?.errorText }
    // Full-document navigation cancels Next's speculative RSC reads in production.
    // Keep those in evidence; all other request failures remain fatal.
    const cancelledRsc = failure.error === 'net::ERR_ABORTED' && request.method() === 'GET' && new URL(request.url()).searchParams.has('_rsc')
    evidence[cancelledRsc ? 'cancelledRscRequests' : 'failedRequests'].push(failure)
  })
  return { context, page }
}
async function checkPage(page, base, path, theme, viewport, kind = 'public') {
  const response = await page.goto(`${base}${path}`, { waitUntil: 'networkidle' })
  assert.equal(response.status(), 200, path)
  await page.locator('h1').waitFor()
  assert.equal(await page.locator('h1').count(), 1, path)
  const robots = await page.locator('meta[name="robots"]').getAttribute('content')
  if (kind === 'admin') assert.match(robots, /noindex/)
  else {
    assert.equal(await page.locator('script[src^="/_vercel/"]').count(), 0, 'non-Vercel hosting must not request unavailable analytics scripts')
    assert.match(robots, /(?:^|,\s*)index(?:,|$)/)
    assert.equal(await page.locator('link[rel="canonical"]').count(), 1, `${path} single canonical`)
    assert.equal(new URL(await page.locator('link[rel="canonical"]').getAttribute('href')).pathname, path)
    const images = await page.locator('meta[property="og:image"]').evaluateAll((nodes) => nodes.map((node) => node.content))
    assert.equal(new Set(images).size, images.length, `${path} duplicate OG image`)
    assert.ok(images.length, `${path} OG image`)
    if (path === '/') assert.equal(images.length, 1, 'one home OG image')
    assert.ok(images.every((image) => !image.includes('/preview.png')), 'no legacy OG')
    assert.doesNotMatch(await page.title(), /\| ITJAGUARS FC \| ITJAGUARS FC$/, 'no duplicated title template')
  }
  assert.equal(await page.locator('html').getAttribute('data-theme'), theme, `${path} theme`)
  const width = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: innerWidth }))
  assert.ok(width.content <= width.viewport, `horizontal overflow ${path} ${viewport.width}: ${JSON.stringify(width)}`)
  const text = await page.locator('body').innerText()
  assert.doesNotMatch(text, /No pudimos cargar los datos|conexión del club todavía no está configurada/)
  await page.screenshot({ path: join(output, `${kind}-${viewport.width}-${theme}-${path.replaceAll(/[^a-zA-Z0-9-]/g, '_') || 'home'}.png`), fullPage: true })
  const result = { path, viewport: viewport.width, theme, status: response.status(), title: await page.locator('h1').innerText(), width }
  evidence[kind === 'public' ? 'pages' : 'admin'].push(result)
  return text
}
try {
  const publicBase = await startServer(root, Number(process.env.LIVE_PUBLIC_PORT ?? 3213))
  const adminRoot = resolve(process.env.LIVE_ADMIN_DIR ?? join(root, '../app_futbol'))
  const adminBase = await startServer(adminRoot, Number(process.env.LIVE_ADMIN_PORT ?? 3214))
  browser = await chromium.launch({ headless: true })
  const links = new Set()
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
    const { context, page } = await contextFor(viewport)
    for (const theme of ['light', 'dark']) {
      await page.goto(publicBase, { waitUntil: 'networkidle' })
      await page.getByRole('button', { name: theme === 'light' ? 'Claro' : 'Oscuro', exact: true }).click()
      for (const path of paths) {
        const text = await checkPage(page, publicBase, path, theme, viewport)
        for (const href of await page.locator('a[href]').evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute('href')))) if (href?.startsWith('/') && !href.startsWith('//')) links.add(href)
        if (path === '/') for (const team of teams) assert.ok(await page.locator(`a[href="/${team.slug}"]`).count(), `live team link ${team.slug}`)
        if (path === '/') {
          assert.equal(await page.title(), 'ITJAGUARS FC')
          assert.ok(await page.getByRole('link', { name: 'ITJAGUARS FC · Inicio', exact: true }).count(), 'header brand')
        }
        if (path === '/plantilla') {
          for (const player of players) assert.ok(text.includes(playerDisplayName(player)), 'live canonical roster display name')
          for (const team of teams) {
            await page.getByRole('combobox', { name: 'Equipo', exact: true }).selectOption(team.id)
            const ids = await page.locator('main article h3 a').evaluateAll((anchors) => anchors.map((anchor) => decodeURIComponent(anchor.getAttribute('href').split('/').at(-1))).sort())
            assert.deepEqual(ids, players.filter((player) => player.teamIds.includes(team.id)).map((player) => player.id).sort(), 'roster uses explicit membership')
          }
          await page.getByRole('combobox', { name: 'Equipo', exact: true }).selectOption('')
        }
        if (path.startsWith('/plantilla/')) {
          const player = allPlayers.find((item) => item.id === decodeURIComponent(path.split('/').at(-1)))
          assert.ok((await page.locator('h1').innerText()).includes(playerDisplayName(player)), 'ficha canonical display name')
          assert.equal(await page.title(), `${playerDisplayName(player)} | ITJAGUARS FC`)
          assert.ok(text.includes(player.name), 'ficha full name retained')
          for (const team of teams.filter((team) => player.teamIds.includes(team.id))) assert.ok(text.includes(team.name), 'ficha membership')
        }
        if (path === '/finanzas') {
          const settings = settingsRows[0]
          assert.ok(settings, 'Live finance settings must exist')
          for (const field of ['bank', 'phone', 'clabe', 'account']) if (settings[field]) assert.ok(text.includes(settings[field]), `finance ${field} matches remote`)
          if (settings.weekly_fee != null) assert.ok(text.includes(new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(Number(settings.weekly_fee))), 'weekly fee matches remote')
          assert.equal(await page.locator('details').count(), debts.filter((row) => Number(row.total_debt) > 0).length)
          if (await page.locator('details').count()) { await page.locator('details summary').first().click(); assert.ok(await page.locator('details[open] li').count(), 'debt events render') }
        }
        if (path.startsWith('/partido/')) {
          const match = detailMatches.get(path.split('/').at(-1))
          const time = page.locator('time').first()
          assert.equal(await time.innerText(), `${formatDateTimeInZone(match.date, 'America/Tijuana')} · Tijuana`)
          assert.ok((await time.locator('..').innerText()).includes(`${formatDateTimeInZone(match.date, 'UTC')} · UTC`), 'viewer UTC remains secondary')
          const team = teams.find((item) => item.id === match.teamId)
          assert.ok((await page.getByRole('link', { name: 'Volver a partidos' }).getAttribute('href')).startsWith(`/${team.slug}/partidos`))
          assert.equal(await page.locator('h1').innerText(), `${team.name} vs ${match.rivalTeam}`, 'canonical match identities')
          const history = page.locator('section[aria-labelledby="h2h-title"]')
          for (const scope of ['team', 'club']) {
            await history.getByRole('button', { name: scope === 'team' ? /^Mismo equipo/ : /^Todo el club/ }).click()
            const expected = priorRivalMatches(matches.map(mapRawMatch), mapRawMatch(match), scope === 'team' ? match.teamId : '', new Date())
            const ids = await history.locator('details li a').evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute('href').split('/').at(-1)))
            assert.deepEqual(ids, expected.map((item) => item.id), 'history excludes current/equal/future rows and respects scope')
          }
          const squad = details.get(match.id).squad
          const recommended = recommendFormation(squad)
          assert.ok(text.includes(`Mejor cobertura posicional: ${recommended.formation.name} · ${recommended.lineup.coverage}/${recommended.formation.slots.length}`))
          const reasons = page.locator('details').filter({ has: page.locator('summary').filter({ hasText: 'Por qué encaja cada jugador' }) })
          await reasons.locator('summary').click()
          for (const formation of getFormations()) {
            await page.getByRole('button', { name: formation.label, exact: true }).click()
            const variant = buildLineupVariants(formation, squad)[0]
            const rendered = await reasons.locator('li').allTextContents()
            assert.equal(rendered.length, formation.slots.length)
            formation.slots.forEach((slot, index) => assert.ok(rendered[index].includes(variant.reasons[slot.id]), 'declared position/side reason'))
          }
        }
      }
      await page.reload({ waitUntil: 'networkidle' })
      assert.equal(await page.locator('html').getAttribute('data-theme'), theme, 'public theme persists')
      await page.goto(`${adminBase}/login`, { waitUntil: 'networkidle' })
      await page.getByRole('button', { name: theme === 'light' ? 'Claro' : 'Oscuro', exact: true }).click()
      await checkPage(page, adminBase, '/login', theme, viewport, 'admin')
      assert.equal(await page.getByLabel('Correo electrónico').inputValue(), '')
      assert.equal(await page.getByLabel('Contraseña', { exact: true }).inputValue(), '')
      await page.reload({ waitUntil: 'networkidle' })
      assert.equal(await page.locator('html').getAttribute('data-theme'), theme, 'admin theme persists')
      for (const path of ['/', '/admin/club', '/admin/seasons', '/admin/players', '/admin/matches', '/admin/goals', '/admin/payments']) {
        await page.goto(`${adminBase}${path}`, { waitUntil: 'networkidle' })
        assert.equal(new URL(page.url()).pathname, '/login', `unauthenticated guard ${path}`)
        evidence.admin.push({ path, viewport: viewport.width, theme, redirectedTo: '/login' })
      }
    }
    await page.getByRole('button', { name: 'Sistema', exact: true }).click()
    for (const colorScheme of ['dark', 'light']) { await page.emulateMedia({ colorScheme }); await page.waitForFunction((theme) => document.documentElement.dataset.theme === theme, colorScheme) }
    await page.goto(publicBase, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Sistema', exact: true }).click()
    for (const colorScheme of ['dark', 'light']) { await page.emulateMedia({ colorScheme }); await page.waitForFunction((theme) => document.documentElement.dataset.theme === theme, colorScheme) }
    await page.goto(`${publicBase}/itj-fc/partidos`, { waitUntil: 'networkidle' })
    await page.getByRole('searchbox').fill('no-such-live-rival-987654321')
    await page.getByText('No hay partidos que coincidan', { exact: false }).waitFor()
    for (const team of teams) for (const season of seasons) for (const suffix of ['', '/partidos', '/estadisticas']) {
      const path = `/${team.slug}${suffix}?temporada=${encodeURIComponent(season.id)}`
      await page.goto(`${publicBase}${path}`, { waitUntil: 'networkidle' })
      assert.equal(await page.getByRole('combobox', { name: 'Temporada', exact: true }).inputValue(), season.id)
      assert.equal(await page.getByRole('heading', { name: 'No pudimos cargar los datos.' }).count(), 0)
      evidence.pages.push({ path, viewport: viewport.width, theme: 'system/light', seasonSelected: season.id })
    }
    for (const path of ['/itj', '/not-a-live-team', '/itj-fc?temporada=not-a-season', '/partido/00000000-0000-0000-0000-000000000000']) {
      await page.goto(`${publicBase}${path}`, { waitUntil: 'networkidle' })
      await page.getByRole('heading', { level: 1 }).filter({ hasText: /Fuera de la cancha|No encontramos/ }).waitFor()
    }
    await context.close()
  }
  for (const href of links) {
    assert.doesNotMatch(href, /^\/itj(?:[/?#]|$)/, 'no obsolete itj links')
    const response = await fetch(`${publicBase}${href}`)
    assert.equal(response.status, 200, `internal link ${href}`)
    evidence.links.push({ href, status: response.status })
  }
  const previewBase = await startServer(root, Number(process.env.LIVE_PREVIEW_PORT ?? 3215), { VERCEL_ENV: 'preview' })
  const { context: metadataContext, page: metadataPage } = await contextFor({ width: 1440, height: 1000 })
  for (const path of ['/', '/plantilla', `/plantilla/${players[0].id}`, `/${teams[0].slug}`, `/partido/${detailMatches.keys().next().value}`]) {
    const response = await metadataPage.goto(`${previewBase}${path}`, { waitUntil: 'networkidle' })
    assert.equal(response.status(), 200)
    assert.match(await metadataPage.locator('meta[name="robots"]').getAttribute('content'), /noindex/)
    evidence.pages.push({ path, environment: 'preview', status: 200, noindex: true })
  }
  for (const [base, preview] of [[publicBase, false], [previewBase, true]]) {
    const robots = await fetch(`${base}/robots.txt`)
    assert.equal(robots.status, 200)
    const text = await robots.text()
    assert.ok(preview ? text.includes('Disallow: /\n') : text.includes('Sitemap:'))
    const sitemap = await fetch(`${base}/sitemap.xml`)
    assert.equal(sitemap.status, 200)
    const xml = await sitemap.text()
    const locations = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1])
    if (preview) assert.deepEqual(locations, [])
    else {
      const expected = ['/', '/plantilla', '/finanzas', ...teams.flatMap((team) => [`/${team.slug}`, `/${team.slug}/partidos`, `/${team.slug}/estadisticas`]), ...matches.map((match) => `/partido/${match.id}`), ...allPlayers.map((player) => `/plantilla/${player.id}`)]
      assert.deepEqual(locations.map((location) => new URL(location).pathname).sort(), expected.sort())
      assert.equal(new Set(locations).size, locations.length)
      assert.ok(locations.every((location) => !location.includes('?')), 'no filter sitemap URLs')
    }
    evidence.links.push({ href: `${preview ? 'preview' : 'production'}/sitemap.xml`, status: 200, entries: locations.length })
  }
  const manifestResponse = await fetch(`${publicBase}/manifest.webmanifest`)
  assert.equal(manifestResponse.status, 200)
  const manifest = await manifestResponse.json()
  assert.equal(manifest.name, 'ITJAGUARS FC')
  for (const icon of [...manifest.icons, { src: '/brand/icon-32.png', sizes: '32x32' }, { src: '/brand/icon-180.png', sizes: '180x180' }]) {
    const response = await fetch(`${publicBase}${icon.src}`)
    assert.equal(response.status, 200)
    const image = await sharp(Buffer.from(await response.arrayBuffer())).metadata()
    assert.equal(`${image.width}x${image.height}`, icon.sizes)
    evidence.links.push({ href: icon.src, status: 200, dimensions: icon.sizes })
  }
  for (const path of ['/opengraph-image', ...teams.map((team) => `/${team.slug}/opengraph-image`), ...[...detailMatches.keys()].map((id) => `/partido/${id}/opengraph-image`), '/not-a-live-team/opengraph-image', '/partido/not-a-live-match/opengraph-image']) {
    const response = await fetch(`${publicBase}${path}`)
    assert.equal(response.status, 200)
    assert.match(response.headers.get('content-type'), /image\/png/)
    const bytes = Buffer.from(await response.arrayBuffer())
    const image = await sharp(bytes).metadata()
    assert.deepEqual([image.width, image.height], [1200, 630])
    await writeFile(join(output, `og-${path.replaceAll('/', '_')}.png`), bytes)
    evidence.links.push({ href: path, status: 200, dimensions: '1200x630', bytes: bytes.length })
  }
  const unconfiguredBase = await startServer(root, Number(process.env.LIVE_UNCONFIGURED_PORT ?? 3216), {
    SUPABASE_URL: '', SUPABASE_PUBLISHABLE_KEY: '', NEXT_PUBLIC_SUPABASE_URL: '',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: '', NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
  })
  for (const path of [`/${teams[0].slug}/opengraph-image`, `/partido/${detailMatches.keys().next().value}/opengraph-image`]) {
    const response = await fetch(`${unconfiguredBase}${path}`)
    assert.equal(response.status, 200, 'missing configuration brand fallback')
    const image = await sharp(Buffer.from(await response.arrayBuffer())).metadata()
    assert.deepEqual([image.width, image.height], [1200, 630])
    evidence.links.push({ href: `unconfigured${path}`, status: 200, dimensions: '1200x630' })
  }
  await metadataContext.close()
  evidence.assertions.push('canonical memberships/fichas', 'all formation reasons', 'strict history boundaries', 'production/preview metadata and sitemap', 'manifest icons', 'OG PNG dimensions and brand fallbacks', 'admin noindex')
  assert.deepEqual(evidence.pageErrors, [], 'browser exceptions')
  assert.deepEqual(evidence.consoleErrors, [], 'console errors')
  assert.deepEqual(evidence.failedRequests, [], 'failed browser requests')
  assert.deepEqual(evidence.blockedWrites, [], 'no writes attempted')
  evidence.assertions.push('live anonymous remote reads', 'all public route types for every live team', 'mobile/desktop light/dark, no overflow', 'live roster and finance settings/debt rows', 'Tijuana primary and UTC secondary', 'actual team slugs and internal links', 'all team/season route combinations', 'search empty state and invalid route views', 'public/admin persisted and OS theme changes', 'all admin route guards without credentials', 'no console errors, exceptions, failed requests or browser writes')
  evidence.result = 'PASS'
  console.log(JSON.stringify({ result: evidence.result, remote: evidence.remote, counts: evidence.counts, publicPageChecks: evidence.pages.length, adminChecks: evidence.admin.length, linkChecks: evidence.links.length, consoleErrors: evidence.consoleErrors.length, pageErrors: evidence.pageErrors.length, failedRequests: evidence.failedRequests.length, cancelledRscRequests: evidence.cancelledRscRequests.length, blockedWrites: evidence.blockedWrites.length, assertions: evidence.assertions, artifacts: output }, null, 2))
} catch (error) {
  console.error(error)
  for (const server of servers) console.error(server.log)
  throw error
} finally {
  await browser?.close()
  for (const [index, server] of servers.entries()) {
    if (server.child.exitCode === null) {
      const exited = once(server.child, 'exit')
      server.child.kill('SIGTERM')
      const timer = setTimeout(() => server.child.kill('SIGKILL'), 10_000)
      await exited
      clearTimeout(timer)
    }
    await writeFile(join(output, `server-${index}.log`), server.log).catch((error) => console.error(`Cannot save server log: ${error.message}`))
  }
  await writeFile(join(output, 'evidence.json'), JSON.stringify(evidence, null, 2)).catch((error) => console.error(`Cannot save evidence: ${error.message}`))
  console.log(`Live evidence: ${output}`)
}
