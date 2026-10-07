import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:net'
import { mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { formatDateTimeInZone } from '../../lib/datetime.ts'

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
const [teams, seasons, matches, settingsRows, debts, players] = await Promise.all([
  read('team', 'select=*&order=sort_order'), read('season', 'select=*&order=startdate.desc'),
  read('v_match', 'select=*&order=date.desc'), read('club_settings', 'select=*&id=eq.1'),
  read('v_player_debt'), read('Player', 'select=id,name,dorsal,positions&active=eq.true'),
])
assert.ok(teams.some((team) => team.slug === 'itj-fc'), 'Live ITJ slug must be itj-fc')
assert.ok(matches.length, 'Live match evidence is required')
const paths = ['/', '/plantilla', '/finanzas']
for (const team of teams) paths.push(`/${team.slug}`, `/${team.slug}/partidos`, `/${team.slug}/estadisticas`)
const detailMatches = new Map()
for (const team of teams) {
  const rows = matches.filter((match) => match.teamId === team.id)
  for (const match of [rows.find((row) => new Date(row.date) <= new Date()), rows.find((row) => new Date(row.date) > new Date())].filter(Boolean)) detailMatches.set(match.id, match)
}
for (const id of detailMatches.keys()) paths.push(`/partido/${id}`)
const servers = []
let browser
const evidence = { remote: new URL(url).hostname, counts: { teams: teams.length, seasons: seasons.length, matches: matches.length, activePlayers: players.length, debtRows: debts.length, settings: settingsRows.length }, pages: [], links: [], admin: [], consoleErrors: [], pageErrors: [], failedRequests: [], blockedWrites: [], assertions: [], artifacts: output }
async function startServer(cwd, port) {
  const probe = createServer()
  await new Promise((done, reject) => { probe.once('error', reject); probe.listen(port, '127.0.0.1', done) })
  await new Promise((done) => probe.close(done))
  const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', String(port)], { cwd, env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', 'pipe', 'pipe'] })
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
  page.on('requestfailed', (request) => evidence.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }))
  return { context, page }
}
async function checkPage(page, base, path, theme, viewport, kind = 'public') {
  const response = await page.goto(`${base}${path}`, { waitUntil: 'networkidle' })
  assert.equal(response.status(), 200, path)
  await page.locator('h1').waitFor()
  assert.equal(await page.locator('h1').count(), 1, path)
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
        if (path === '/plantilla') for (const player of players) assert.ok(text.includes(player.name), 'live roster name')
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
  assert.deepEqual(evidence.pageErrors, [], 'browser exceptions')
  assert.deepEqual(evidence.consoleErrors, [], 'console errors')
  assert.deepEqual(evidence.failedRequests, [], 'failed browser requests')
  assert.deepEqual(evidence.blockedWrites, [], 'no writes attempted')
  evidence.assertions = ['live anonymous remote reads', 'all public route types for every live team', 'mobile/desktop light/dark, no overflow', 'live roster and finance settings/debt rows', 'Tijuana primary and UTC secondary', 'actual team slugs and internal links', 'all team/season route combinations', 'search empty state and invalid route views', 'public/admin persisted and OS theme changes', 'all admin route guards without credentials', 'no console errors, exceptions, failed requests or browser writes']
  console.log(JSON.stringify({ result: 'PASS', ...evidence }, null, 2))
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
