import { cn } from '@/lib/utils'
import type { DataGridClassNames, GridKitClassNames, GridKitStyles, DataGridStyles } from '@/types'

interface GridKitErrorProps {
  error: Error
  classNames?: Pick<DataGridClassNames | GridKitClassNames, 'error'>
  styles?: Pick<DataGridStyles | GridKitStyles, 'error'>
}

export function GridKitError({ error, classNames, styles }: GridKitErrorProps) {
  return (
    <div className={cn('gridkit-error', classNames?.error)} style={styles?.error}>
      {error.message}
    </div>
  )
}
