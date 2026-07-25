import type { CSSProperties } from 'react'

export function readGridKitVars(node: HTMLElement): CSSProperties {
  const computed = getComputedStyle(node)
  const vars: CSSProperties = {}

  for (let index = 0; index < computed.length; index += 1) {
    const name = computed.item(index)
    if (name.startsWith('--gridkit-')) {
      ;(vars as Record<string, string>)[name] = computed.getPropertyValue(name).trim()
    }
  }

  return vars
}

export function sameGridKitVars(a: CSSProperties, b: CSSProperties) {
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  if (aKeys.length !== bKeys.length) return false
  return aKeys.every(
    (key) => (a as Record<string, unknown>)[key] === (b as Record<string, unknown>)[key],
  )
}
