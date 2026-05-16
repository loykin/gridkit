import type { FilterFn } from '@tanstack/react-table'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const defaultGlobalFilterFn: FilterFn<any> = (row, columnId, value: string) =>
  String(row.getValue(columnId) ?? '')
    .toLowerCase()
    .includes(value.toLowerCase())

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const multiSelectFilterFn: FilterFn<any> = (row, columnId, value: string[]) =>
  value.includes(String(row.getValue(columnId) ?? ''))
multiSelectFilterFn.autoRemove = (val: string[]) => !val || val.length === 0

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const betweenFilterFn: FilterFn<any> = (row, columnId, value: [string, string]) => {
  const raw = row.getValue<number>(columnId)
  const [minStr, maxStr] = value
  const min = minStr !== '' ? Number(minStr) : -Infinity
  const max = maxStr !== '' ? Number(maxStr) : Infinity
  return raw >= min && raw <= max
}
betweenFilterFn.autoRemove = (val: [string, string]) => !val || (val[0] === '' && val[1] === '')

function toDateKey(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  const raw = String(value ?? '')
  const isoDate = /^\d{4}-\d{2}-\d{2}/.exec(raw)
  if (isoDate) return isoDate[0]
  const time = Date.parse(raw)
  return Number.isNaN(time) ? '' : new Date(time).toISOString().slice(0, 10)
}

function toDateTimeMs(value: unknown): number | undefined {
  if (value instanceof Date) {
    const time = value.getTime()
    return Number.isNaN(time) ? undefined : time
  }
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined

  const raw = String(value ?? '').trim()
  if (!raw) return undefined

  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(raw)
    ? raw.replace(' ', 'T')
    : raw
  const time = Date.parse(normalized)
  return Number.isNaN(time) ? undefined : time
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const dateFilterFn: FilterFn<any> = (row, columnId, value: string) => {
  if (!value) return true
  return toDateKey(row.getValue(columnId)) === value
}
dateFilterFn.autoRemove = (val: string) => !val

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const dateRangeFilterFn: FilterFn<any> = (row, columnId, value: [string, string]) => {
  const [start, end] = value
  if (!start && !end) return true
  const current = toDateKey(row.getValue(columnId))
  if (!current) return false
  return (!start || current >= start) && (!end || current <= end)
}
dateRangeFilterFn.autoRemove = (val: [string, string]) => !val || (val[0] === '' && val[1] === '')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const dateTimeFilterFn: FilterFn<any> = (row, columnId, value: string) => {
  const target = toDateTimeMs(value)
  const current = toDateTimeMs(row.getValue(columnId))
  return target === undefined || current === target
}
dateTimeFilterFn.autoRemove = (val: string) => !val

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const dateTimeRangeFilterFn: FilterFn<any> = (row, columnId, value: [string, string]) => {
  const [startValue, endValue] = value
  const start = toDateTimeMs(startValue)
  const end = toDateTimeMs(endValue)
  if (start === undefined && end === undefined) return true
  const current = toDateTimeMs(row.getValue(columnId))
  if (current === undefined) return false
  return (start === undefined || current >= start) && (end === undefined || current <= end)
}
dateTimeRangeFilterFn.autoRemove = (val: [string, string]) => !val || (val[0] === '' && val[1] === '')
