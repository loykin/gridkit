import {
  createRow,
  memo,
  getMemoOptions,
  type RowData,
  type TableFeature,
  type RowModel,
  type Table,
  type Row,
} from '@tanstack/react-table'
import type { Transaction, DataStore } from '../DataStore'

// ── Declaration merging ───────────────────────────────────────────────────────
declare module '@tanstack/react-table' {
  interface TableOptionsResolved<TData extends RowData> {
    dataStore?: DataStore<TData>
  }

  interface Table<TData extends RowData> {
    /** O(1) add/update/delete. Triggers React re-render automatically. */
    applyTransaction: (tx: Transaction<TData>) => void
    /** O(1) row lookup by id */
    getRowNodeById: (id: string) => TData | undefined
    /** Escape hatch — direct access to the internal DataStore */
    _dataStore: DataStore<TData> | undefined
  }
}

// ── Phase 3: Row-caching getCoreRowModel ──────────────────────────────────────
/**
 * Drop-in replacement for getCoreRowModel() when a DataStore is used.
 *
 * Differences from the stock implementation:
 * 1. Memo depends on store.getVersion() (a number) instead of table.options.data
 *    (an array reference). No unnecessary recomputation between transactions.
 * 2. Row objects are reused across calls. For rows whose `original` reference is
 *    unchanged, the row object — and all its memoized cell/visible-cell results —
 *    stays stable, letting React.memo skip re-rendering those rows.
 * 3. For rows whose data was updated (new object, same id), `original` is swapped
 *    in-place and `_valuesCache` is cleared so getValue() re-evaluates.
 */
export function getDataStoreCoreRowModel<T extends RowData>(): (
  table: Table<T>,
) => () => RowModel<T> {
  return (table: Table<T>) => {
    const rowCache = new Map<string, Row<T>>()

    return memo(
      () => {
        const store = table.options.dataStore
        // Version is a plain number — changes only when a transaction is applied
        return [store?.getVersion() ?? -1] as [number]
      },
      () => {
        const store = table.options.dataStore!
        const data = store.getSnapshot()

        const rowModel: RowModel<T> = { rows: [], flatRows: [], rowsById: {} }
        const seenIds = new Set<string>()

        for (let i = 0; i < data.length; i++) {
          const item = data[i]
          const id = table._getRowId(item, i)
          seenIds.add(id)

          let row = rowCache.get(id)

          if (row) {
            if (row.original !== item) {
              // Data changed — swap original and bust the accessor value cache
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ;(row as any).original = item
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ;(row as any)._valuesCache = {}
            }
            // All memoized row methods (getVisibleCells etc.) remain stable
          } else {
            row = createRow(table, id, item, i, 0)
            rowCache.set(id, row)
          }

          rowModel.rows.push(row)
          rowModel.flatRows.push(row)
          rowModel.rowsById[id] = row
        }

        // Evict deleted rows
        for (const id of rowCache.keys()) {
          if (!seenIds.has(id)) rowCache.delete(id)
        }

        return rowModel
      },
      getMemoOptions(
        table.options,
        'debugTable',
        'getRowModel',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        () => (table as any)._autoResetPageIndex?.(),
      ),
    )
  }
}

// ── Feature ───────────────────────────────────────────────────────────────────
export const DataStoreFeature: TableFeature = {
  createTable: (table) => {
    const store = table.options.dataStore

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(table as any)._dataStore = store

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(table as any).applyTransaction = (tx: Transaction<any>) => {
      if (!store) {
        console.warn('[GridKit] applyTransaction called without dataStore')
        return
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      store.applyTransaction(tx as Transaction<any>)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(table as any).getRowNodeById = (id: string) => store?.get(id)
  },
}
