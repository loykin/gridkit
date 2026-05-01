import { createContext, useContext } from 'react'

export interface EditingCellContextValue {
  editingCellId: string | null
  startEdit: (cellId: string) => void
  stopEdit: () => void
  commitEdit: (rowId: string, columnId: string, value: unknown) => void
}

export const EditingCellContext = createContext<EditingCellContextValue | null>(null)

export function useEditingCell(): EditingCellContextValue | null {
  return useContext(EditingCellContext)
}
