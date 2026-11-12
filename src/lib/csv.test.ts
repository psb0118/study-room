import { describe, expect, it } from 'vitest'
import { csvFileName, toCsv } from './csv'

describe('csv', () => {
  it('escapes commas, quotes, and newlines', () => {
    expect(toCsv([['a,b', '그는 "공부"했다'], ['줄\n바꿈']])).toBe(
      '"a,b","그는 ""공부""했다"\r\n"줄\n바꿈"',
    )
  })

  it('creates a safe download name', () => {
    expect(csvFileName('공부/왕', new Date(2026, 10, 11, 12))).toBe(
      'haru-gyeol-공부왕-2026-11-11.csv',
    )
  })
})
