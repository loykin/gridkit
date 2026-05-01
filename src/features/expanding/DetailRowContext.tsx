import { createContext, useContext } from 'react'

export interface DetailRowContextValue {
  expandedRows: Set<string>
  toggleRow: (rowId: string) => void
}

export const DetailRowContext = createContext<DetailRowContextValue | null>(null)

export function useDetailRow(): DetailRowContextValue | null {
  return useContext(DetailRowContext)
}
