import * as React from 'react'

/**
 * ScrollTable — DataGridTableView 전용 table 컴포넌트
 *
 * 왜 shadcn <Table>을 쓰지 않는가?
 * 1. shadcn Table은 내부적으로 <div overflow-x-auto> wrapper를 추가해
 *    DataGridTableView의 스크롤 컨테이너와 이중 스크롤 충돌이 발생한다.
 * 2. DataGridTableView는 table.getTotalSize()로 폭을 직접 제어해야 하므로
 *    외부 wrapper 없이 <table> 엘리먼트에 직접 접근이 필요하다.
 * 3. sticky header가 border-collapse와 함께 쓰이면 브라우저 버그가 있으므로
 *    border-separate + border-spacing-0 조합을 사용한다.
 */
const ScrollTable = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <table
    ref={ref}
    className={['text-sm border-separate border-spacing-0', className].filter(Boolean).join(' ')}
    {...props}
  />
))
ScrollTable.displayName = 'ScrollTable'

export { ScrollTable }
