import { test } from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { resolveTheme, themeScript, validTheme } from '../../lib/theme.ts'

test('theme defaults to system and manual selection overrides OS', () => {
  assert.equal(validTheme('unexpected'), 'system')
  assert.equal(resolveTheme('system', true), 'dark')
  assert.equal(resolveTheme('light', true), 'light')
  assert.equal(resolveTheme('dark', false), 'dark')
})
test('pre-paint theme script applies saved choice and survives blocked storage', () => {
  for (const [stored, osDark, expected] of [['light', true, 'light'], ['dark', false, 'dark'], ['system', true, 'dark'], ['bad', false, 'light'], [null, true, 'dark']] as const) {
    const root = { dataset: {} as Record<string, string>, style: {} as Record<string, string> }
    vm.runInNewContext(themeScript, { document: { documentElement: root }, localStorage: { getItem: () => { if (stored === null) throw new Error('blocked'); return stored } }, matchMedia: () => ({ matches: osDark }) })
    assert.equal(root.dataset.theme, expected)
    assert.equal(root.style.colorScheme, expected)
  }
})
