import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { useStickToBottom } from '../useStickToBottom'

// jsdom always returns 0 for scrollHeight/clientHeight, so we override them to simulate scroll behavior.
function createScrollContainer(
  scrollHeight: number,
  clientHeight: number,
  initialScrollTop = 0,
) {
  const el = document.createElement('div')
  let _scrollTop = initialScrollTop

  Object.defineProperty(el, 'scrollHeight', { get: () => scrollHeight, configurable: true })
  Object.defineProperty(el, 'clientHeight', { get: () => clientHeight, configurable: true })
  Object.defineProperty(el, 'scrollTop', {
    get: () => _scrollTop,
    set: (v: number) => { _scrollTop = v },
    configurable: true,
  })

  return el
}

function makeRef(el: HTMLElement) {
  return { current: el } as React.RefObject<HTMLElement>
}

describe('useStickToBottom', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initial atBottom state is always true (assumed stuck to bottom on mount)', () => {
    // atBottom=true regardless of scroll position: prerequisite for scrolling to bottom on mount
    const el = createScrollContainer(600, 300, 0)
    const { result } = renderHook(() =>
      useStickToBottom({ containerRef: makeRef(el), threshold: 48 }),
    )
    expect(result.current.atBottom).toBe(true)
  })

  it('sets scrollTop to scrollHeight when enabled=true on mount (stick-to-bottom)', () => {
    const el = createScrollContainer(600, 300, 0)
    renderHook(({ dep }) =>
      useStickToBottom({ containerRef: makeRef(el), enabled: true, threshold: 48, dependency: dep }),
      { initialProps: { dep: 'v1' } },
    )
    // mount effect: atBottomRef=true → scrollTop = scrollHeight
    expect(el.scrollTop).toBe(600)
  })

  it('transitions atBottom to false when scrolled to top after scroll event', () => {
    let mockScrollTop = 0
    const el = document.createElement('div')
    Object.defineProperty(el, 'scrollHeight', { get: () => 600, configurable: true })
    Object.defineProperty(el, 'clientHeight', { get: () => 300, configurable: true })
    Object.defineProperty(el, 'scrollTop', {
      get: () => mockScrollTop,
      set: (v: number) => { mockScrollTop = v },
      configurable: true,
    })

    const { result } = renderHook(() =>
      useStickToBottom({ containerRef: makeRef(el), threshold: 48 }),
    )

    // mount → stick → scrollTop=600 → atBottom=true
    // user scrolls up
    act(() => {
      mockScrollTop = 0
      el.dispatchEvent(new Event('scroll'))
    })
    expect(result.current.atBottom).toBe(false)
  })

  it('transitions atBottom to true when scrolled back to bottom', () => {
    let mockScrollTop = 0
    const el = document.createElement('div')
    Object.defineProperty(el, 'scrollHeight', { get: () => 600, configurable: true })
    Object.defineProperty(el, 'clientHeight', { get: () => 300, configurable: true })
    Object.defineProperty(el, 'scrollTop', {
      get: () => mockScrollTop,
      set: (v: number) => { mockScrollTop = v },
      configurable: true,
    })

    const { result } = renderHook(() =>
      useStickToBottom({ containerRef: makeRef(el), threshold: 48 }),
    )

    // at top → atBottom=false
    act(() => {
      mockScrollTop = 0
      el.dispatchEvent(new Event('scroll'))
    })
    expect(result.current.atBottom).toBe(false)

    // near bottom (600-300=300, scrollTop=260 → 40px from bottom ≤ 48)
    act(() => {
      mockScrollTop = 260
      el.dispatchEvent(new Event('scroll'))
    })
    expect(result.current.atBottom).toBe(true)
  })

  it('sets scrollTop to scrollHeight when dependency changes and atBottom=true', () => {
    let mockScrollTop = 300
    const el = document.createElement('div')
    Object.defineProperty(el, 'scrollHeight', { get: () => 600, configurable: true })
    Object.defineProperty(el, 'clientHeight', { get: () => 300, configurable: true })
    Object.defineProperty(el, 'scrollTop', {
      get: () => mockScrollTop,
      set: (v: number) => { mockScrollTop = v },
      configurable: true,
    })

    const { rerender } = renderHook(
      ({ dep }: { dep: string }) =>
        useStickToBottom({ containerRef: makeRef(el), enabled: true, threshold: 48, dependency: dep }),
      { initialProps: { dep: 'v1' } },
    )

    // mount: atBottomRef=true → scrollTop = 600
    // assume user is near bottom (scrollTop=300, isNearBottom=true)
    act(() => {
      mockScrollTop = 300
      el.dispatchEvent(new Event('scroll'))
    })

    // dep change → stick effect → scrollTop = scrollHeight
    act(() => {
      rerender({ dep: 'v2' })
    })

    expect(el.scrollTop).toBe(600)
  })

  it('does not change scrollTop when dependency changes and atBottom=false', () => {
    let mockScrollTop = 0
    const el = document.createElement('div')
    Object.defineProperty(el, 'scrollHeight', { get: () => 600, configurable: true })
    Object.defineProperty(el, 'clientHeight', { get: () => 300, configurable: true })
    Object.defineProperty(el, 'scrollTop', {
      get: () => mockScrollTop,
      set: (v: number) => { mockScrollTop = v },
      configurable: true,
    })

    const { rerender } = renderHook(
      ({ dep }: { dep: string }) =>
        useStickToBottom({ containerRef: makeRef(el), enabled: true, threshold: 48, dependency: dep }),
      { initialProps: { dep: 'v1' } },
    )

    // mount: atBottomRef=true → scrollTop=600 (stuck). then user scrolls up
    act(() => {
      mockScrollTop = 0  // force scroll to top
      el.dispatchEvent(new Event('scroll'))
    })
    // should have transitioned to atBottom=false

    // dep change → atBottom=false so scrollTop is not modified
    act(() => {
      rerender({ dep: 'v2' })
    })

    expect(el.scrollTop).toBe(0)
  })

  it('does not change scrollTop on dependency change when enabled=false', () => {
    let mockScrollTop = 300
    const el = document.createElement('div')
    Object.defineProperty(el, 'scrollHeight', { get: () => 600, configurable: true })
    Object.defineProperty(el, 'clientHeight', { get: () => 300, configurable: true })
    Object.defineProperty(el, 'scrollTop', {
      get: () => mockScrollTop,
      set: (v: number) => { mockScrollTop = v },
      configurable: true,
    })

    const { rerender } = renderHook(
      ({ dep }: { dep: string }) =>
        useStickToBottom({
          containerRef: makeRef(el),
          enabled: false,
          threshold: 48,
          dependency: dep,
        }),
      { initialProps: { dep: 'v1' } },
    )

    act(() => {
      rerender({ dep: 'v2' })
    })

    // enabled=false → stick effect does not run, scrollTop unchanged
    expect(el.scrollTop).toBe(300)
  })

  it('calls onAtBottomChange callback on state transition', () => {
    const onAtBottomChange = vi.fn()
    let mockScrollTop = 300
    const el = document.createElement('div')
    Object.defineProperty(el, 'scrollHeight', { get: () => 600, configurable: true })
    Object.defineProperty(el, 'clientHeight', { get: () => 300, configurable: true })
    Object.defineProperty(el, 'scrollTop', {
      get: () => mockScrollTop,
      set: (v: number) => { mockScrollTop = v },
      configurable: true,
    })

    renderHook(() =>
      useStickToBottom({ containerRef: makeRef(el), threshold: 48, onAtBottomChange }),
    )

    // transition true → false
    act(() => {
      mockScrollTop = 0
      el.dispatchEvent(new Event('scroll'))
    })
    expect(onAtBottomChange).toHaveBeenCalledWith(false)

    // transition false → true
    act(() => {
      mockScrollTop = 260
      el.dispatchEvent(new Event('scroll'))
    })
    expect(onAtBottomChange).toHaveBeenCalledWith(true)

    expect(onAtBottomChange).toHaveBeenCalledTimes(2)
  })

  it('does not call onAtBottomChange redundantly when atBottom state does not change', () => {
    const onAtBottomChange = vi.fn()
    let mockScrollTop = 300
    const el = document.createElement('div')
    Object.defineProperty(el, 'scrollHeight', { get: () => 600, configurable: true })
    Object.defineProperty(el, 'clientHeight', { get: () => 300, configurable: true })
    Object.defineProperty(el, 'scrollTop', {
      get: () => mockScrollTop,
      set: (v: number) => { mockScrollTop = v },
      configurable: true,
    })

    renderHook(() =>
      useStickToBottom({ containerRef: makeRef(el), threshold: 48, onAtBottomChange }),
    )

    // scroll to same position while atBottom=true (no state change)
    act(() => {
      mockScrollTop = 300
      el.dispatchEvent(new Event('scroll'))
    })
    act(() => {
      mockScrollTop = 280
      el.dispatchEvent(new Event('scroll'))
    })

    // no callback when atBottom state does not change
    expect(onAtBottomChange).not.toHaveBeenCalled()
  })

  it('atBottom=true when scrollHeight-scrollTop-clientHeight === threshold (boundary)', () => {
    // 600-252-300=48, threshold=48 → exactly at boundary → atBottom=true
    let mockScrollTop = 252
    const el = document.createElement('div')
    Object.defineProperty(el, 'scrollHeight', { get: () => 600, configurable: true })
    Object.defineProperty(el, 'clientHeight', { get: () => 300, configurable: true })
    Object.defineProperty(el, 'scrollTop', {
      get: () => mockScrollTop,
      set: (v: number) => { mockScrollTop = v },
      configurable: true,
    })

    const { result } = renderHook(() =>
      useStickToBottom({ containerRef: makeRef(el), threshold: 48 }),
    )

    act(() => {
      el.dispatchEvent(new Event('scroll'))
    })

    expect(result.current.atBottom).toBe(true)
  })
})
