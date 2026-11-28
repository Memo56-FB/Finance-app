import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(path.resolve(__dirname, '../../app/globals.css'), 'utf8')

type Hsl = [number, number, number]

const readTokens = (block: string): Record<string, Hsl> => {
  const tokens: Record<string, Hsl> = {}
  for (const match of block.matchAll(/--([a-z0-9-]+):\s*(\d+)\s+(\d+)%\s+(\d+)%;/g)) {
    tokens[match[1]] = [Number(match[2]), Number(match[3]), Number(match[4])]
  }
  return tokens
}

const blockFor = (selector: string) => {
  const start = css.indexOf(`${selector} {`)
  if (start === -1) throw new Error(`Missing selector ${selector}`)
  return css.slice(start, css.indexOf('}', start))
}

const luminance = ([h, s, l]: Hsl) => {
  const sat = s / 100
  const light = l / 100
  const chroma = (1 - Math.abs(2 * light - 1)) * sat
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = light - chroma / 2
  const [r, g, b] =
    h < 60 ? [chroma, x, 0]
    : h < 120 ? [x, chroma, 0]
    : h < 180 ? [0, chroma, x]
    : h < 240 ? [0, x, chroma]
    : h < 300 ? [x, 0, chroma]
    : [chroma, 0, x]
  const channel = (value: number) => {
    const v = value + m
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

const ratio = (a: Hsl, b: Hsl) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const base = readTokens(blockFor(':root'))
const themes = {
  dark: base,
  light: readTokens(blockFor(":root[data-theme='light']")),
}

describe.each(Object.entries(themes))('%s theme contrast', (_name, ramp) => {
  const t = { ...base, ...ramp }

  it('keeps reading text at 4.5:1 or better on surfaces', () => {
    expect(ratio(t.ink, t.bg)).toBeGreaterThanOrEqual(4.5)
    expect(ratio(t.ink, t.panel)).toBeGreaterThanOrEqual(4.5)
    expect(ratio(t['ink-muted'], t.bg)).toBeGreaterThanOrEqual(4.5)
    expect(ratio(t['ink-muted'], t.panel)).toBeGreaterThanOrEqual(4.5)
    expect(ratio(t['ink-muted'], t.line)).toBeGreaterThanOrEqual(4.5)
  })

  it('keeps text on the theme fills at 4.5:1 or better', () => {
    expect(ratio(t.ink, t.p3)).toBeGreaterThanOrEqual(4.5)
    expect(ratio(t.ink, t.p4)).toBeGreaterThanOrEqual(4.5)
  })

  it('keeps accents and the focus indicator at 3:1 or better', () => {
    expect(ratio(t.gold, t.bg)).toBeGreaterThanOrEqual(3)
    expect(ratio(t.gold, t.panel)).toBeGreaterThanOrEqual(3)
    expect(ratio(t.gold, t.p4)).toBeGreaterThanOrEqual(3)
    expect(ratio(t.p1, t.panel)).toBeGreaterThanOrEqual(3)
    expect(ratio(t.p2, t.bg)).toBeGreaterThanOrEqual(3)
    expect(ratio(t.danger, t.panel)).toBeGreaterThanOrEqual(4.5)
  })
})
