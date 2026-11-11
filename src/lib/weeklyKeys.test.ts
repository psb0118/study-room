import { describe, expect, it } from 'vitest'
import { weekKeysSince } from './weeklyKeys'

describe('weekKeysSince', () => {
  it('includes every Monday from the account creation week through today', () => {
    expect(
      weekKeysSince(
        new Date(2026, 10, 11, 12).getTime(),
        new Date(2026, 10, 20, 12),
      ),
    ).toEqual(['2026-11-09', '2026-11-16'])
  })

  it('uses the current week when the creation time is missing', () => {
    expect(
      weekKeysSince(0, new Date(2026, 10, 20, 12)),
    ).toEqual(['2026-11-16'])
  })
})
