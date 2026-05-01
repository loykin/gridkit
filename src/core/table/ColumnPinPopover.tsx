import { useState } from 'react'
import type { Column, Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useIcons } from '@/core/IconsContext'

interface ColumnPinPopoverProps<T extends object> {
  col: Column<T>
  table: Table<T>
}

export function ColumnPinPopover<T extends object>({ col }: ColumnPinPopoverProps<T>) {
  const [open, setOpen] = useState(false)
  const icons = useIcons()
  const pinned = col.getIsPinned()

  const close = () => setOpen(false)

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={(props) => (
            <Button
              {...props}
              variant="ghost"
              size="icon-xs"
              className={pinned ? 'dg-btn--filter-active' : 'dg-btn--filter-inactive'}
            >
              {pinned === 'left' ? icons.pinLeft : pinned === 'right' ? icons.pinRight : icons.pinLeft}
            </Button>
          )}
        />
        <PopoverContent side="bottom" align="start" style={{ width: 140, padding: '4px 0' }}>
          <button
            className="dg-popover-option"
            onClick={() => { col.pin('left'); close() }}
            data-active={pinned === 'left' ? 'true' : undefined}
          >
            {icons.pinLeft}
            <span>Pin Left</span>
          </button>
          <button
            className="dg-popover-option"
            onClick={() => { col.pin('right'); close() }}
            data-active={pinned === 'right' ? 'true' : undefined}
          >
            {icons.pinRight}
            <span>Pin Right</span>
          </button>
          {pinned && (
            <button
              className="dg-popover-option"
              onClick={() => { col.pin(false); close() }}
            >
              {icons.pinOff}
              <span>Unpin</span>
            </button>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
