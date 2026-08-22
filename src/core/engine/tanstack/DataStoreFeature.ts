import {
  assignTableAPIs,
  constructRow,
  createCoreRowModel,
  makeObjectMap,
  skipFirstRun,
  tableMemo,
  type RowData,
  type GridKitTableFeatures,
  type TableFeature,
  type TableFeatures,
  type RowModel,
  type CoreTable,
  type Row,
} from '@/core/engine/tanstack/gridKitTable'
import type { Transaction, TransactionResult, DataStore } from '../store/DataStore'

interface DataStoreTableOptions<TData extends RowData> {
  dataStore?: DataStore<TData>
}

interface DataStoreTable<TData extends RowData> {
  applyTransaction: (tx: Transaction<TData>) => void
  applyTransactionAsync: (tx: Transaction<TData>) => Promise<TransactionResult>
  getRowNodeById: (id: string) => TData | undefined
  _dataStore: DataStore<TData> | undefined
}

declare module '@tanstack/react-table' {
  interface Plugins {
    dataStoreFeature: TableFeature
  }

  interface TableOptions_FeatureMap<
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    in out TFeatures extends TableFeatures,
    in out TData extends RowData,
  > {
    dataStoreFeature: DataStoreTableOptions<TData>
  }

  interface Table_FeatureMap<
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    in out TFeatures extends TableFeatures,
    in out TData extends RowData,
  > {
    dataStoreFeature: DataStoreTable<TData>
  }

}

// ── Phase 3: Row-caching core row model ───────────────────────────────────────
/**
 * Core row-model factory used when a DataStore is active.
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
  table: CoreTable<T>,
) => () => RowModel<T> {
  return (table: CoreTable<T>) => {
    const rowCache = new Map<string, Row<T>>()
    // tableMemo's public signature intentionally erases the row-data generic.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const memoTable = table as unknown as CoreTable<any>

    return tableMemo<GridKitTableFeatures, [number], unknown, RowModel<T>>({
      feature: 'dataStoreFeature',
      table: memoTable,
      fnName: 'table.getCoreRowModel',
      memoDeps: () => {
        const store = table.options.dataStore
        // Version is a plain number — changes only when a transaction is applied
        return [store?.getVersion() ?? -1] as [number]
      },
      fn: () => {
        const store = table.options.dataStore!
        const data = store.getSnapshot()

        const rowModel: RowModel<T> = { rows: [], flatRows: [], rowsById: makeObjectMap() }
        const seenIds = new Set<string>()

        for (let i = 0; i < data.length; i++) {
          const item = data[i]
          const id = table.getRowId(item, i)
          seenIds.add(id)

          let row = rowCache.get(id)

          if (row) {
            if (row.original !== item) {
              // Data changed — swap original and bust the accessor value cache
              row.original = item
              row._valuesCache = {}
            }
            // All memoized row methods (getVisibleCells etc.) remain stable
          } else {
            row = constructRow(table, id, item, i, 0)
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
      onAfterUpdate: skipFirstRun(() => {
        table.autoResetExpanded()
        if (
          (table.options.autoResetAll ?? table.options.autoResetPageIndex ?? !table.options.manualPagination)
          && (table.atoms.pagination?.get()?.pageIndex ?? 0) !== 0
        ) {
          table.resetPageIndex(true)
        }
        if (table.options.autoResetAll ?? table.options.autoResetSorting ?? false) {
          table.resetSorting()
        }
        table.autoResetCellSelection()
      }),
    })
  }
}

export function createGridKitCoreRowModel<T extends RowData>() {
  const createDefaultRowModel = createCoreRowModel<GridKitTableFeatures, T>()
  const createStoreRowModel = getDataStoreCoreRowModel<T>()

  return (table: CoreTable<T>) => table.options.dataStore
    ? createStoreRowModel(table)
    : createDefaultRowModel(table)
}

// ── Feature ───────────────────────────────────────────────────────────────────
export const DataStoreFeature: TableFeature = {
  initTableInstanceData: (table) => {
    const gridTable = table as unknown as CoreTable<RowData>
    gridTable._dataStore = gridTable.options.dataStore
  },
  constructTableAPIs: (table) => {
    const gridTable = table as unknown as CoreTable<RowData>
    assignTableAPIs('dataStoreFeature', table, {
      table_applyTransaction: { fn: (tx: Transaction<RowData>) => {
        gridTable._dataStore?.applyTransaction(tx)
      } },
      table_applyTransactionAsync: { fn: (tx: Transaction<RowData>) =>
        gridTable._dataStore?.applyTransactionAsync(tx) ?? Promise.resolve({ ok: true, affected: 0 }) },
      table_getRowNodeById: { fn: (id: string) => gridTable._dataStore?.get(id) },
    })
  },
}
