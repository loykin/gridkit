import type { GridKitTableColumn, GridKitTablePayload } from '@/types'

const SAMPLE_SIZE = 20

function toLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]*)?$/.test(value)
}

function inferColumnType(values: unknown[]): GridKitTableColumn['type'] {
  const nonNull = values.filter((v) => v != null)
  if (nonNull.length === 0) return 'text'
  if (nonNull.every((v) => typeof v === 'boolean')) return 'boolean'
  if (nonNull.every((v) => typeof v === 'number')) return 'number'
  if (nonNull.every((v) => typeof v === 'string' && isIsoDate(v))) return 'date'
  return 'text'
}

const WIDE_KEY_PATTERNS = /description|content|message|note|comment|address|bio|summary|detail|reason|text|remark/i
const NARROW_KEY_PATTERNS = /^(id|_id|pk|fk|uuid|key|code|status|type|flag|rank|seq|no|num|count|qty|pct|pct_\w+|\w+_id|\w+_code|\w+_no)$/i

function inferFlex(key: string, type: GridKitTableColumn['type']): number {
  if (type === 'boolean') return 0.6
  if (NARROW_KEY_PATTERNS.test(key)) return 0.7
  if (type === 'number') return 0.8
  if (type === 'date') return 1.0
  if (WIDE_KEY_PATTERNS.test(key)) return 1.8
  return 1.0
}

export interface InferTablePayloadOptions {
  title?: string
  /** Per-column overrides applied after inference. */
  hints?: Record<string, Partial<GridKitTableColumn>>
}

export function inferTablePayload(
  rows: Record<string, unknown>[],
  options: InferTablePayloadOptions = {},
): GridKitTablePayload {
  const { title, hints } = options

  const sample = rows.slice(0, SAMPLE_SIZE)

  const keys = Array.from(new Set(sample.flatMap((row) => Object.keys(row))))

  const columns: GridKitTableColumn[] = keys.map((key) => {
    const values = sample.map((row) => row[key])
    const type = inferColumnType(values)
    const col: GridKitTableColumn = {
      key,
      label: toLabel(key),
      type,
      flex: inferFlex(key, type),
      ...(type === 'number' ? { align: 'right' } : {}),
      ...hints?.[key],
    }
    return col
  })

  return { type: 'gridkit-table', title, columns, rows }
}
