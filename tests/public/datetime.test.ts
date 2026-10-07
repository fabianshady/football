import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatDateTimeInZone, formatVenueClock, formatVenueDateTime, getCountdownParts, parseMatchDate } from '../../lib/datetime.ts'

test('UTC kickoff crosses the calendar day in Tijuana without altering the instant', () => {
  const input = '2026-10-07T01:50:00+00:00'
  assert.equal(parseMatchDate(input).toISOString(), '2026-10-07T01:50:00.000Z')
  assert.equal(formatVenueClock(input), '18:50')
  assert.match(formatVenueDateTime(input), /6.*oct.*2026/)
  assert.match(formatDateTimeInZone(input, 'UTC'), /7.*oct.*2026/)
})
test('winter and summer offsets follow America/Tijuana DST', () => {
  assert.equal(formatVenueClock('2026-01-08T02:00:00Z'), '18:00')
  assert.equal(formatVenueClock('2026-07-08T02:00:00Z'), '19:00')
})
test('naive database timestamps are UTC and parsing rejects invalid dates', () => {
  assert.equal(parseMatchDate('2026-10-07 01:50:00').toISOString(), '2026-10-07T01:50:00.000Z')
  assert.throws(() => parseMatchDate('not a date'), RangeError)
})
test('countdown uses elapsed instants and clamps an expired target', () => {
  assert.deepEqual(getCountdownParts('2026-10-07T01:50:00Z', new Date('2026-10-06T00:49:00Z')), { totalMs: 90060000, days: 1, hours: 1, minutes: 1, seconds: 0, expired: false })
  assert.equal(getCountdownParts('2026-10-07T01:50:00Z', new Date('2026-10-08T01:50:00Z')).days, 0)
})
