import React, { useRef } from 'react'
import { render, act } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { useReverseInfiniteScroll } from '../useReverseInfiniteScroll'

// ── IntersectionObserver mock ────────────────────────────────────────────────
// vi.fn() arrow functions cannot be used as constructors, so a class is used instead.

type IOCallback = (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => void

function setupIntersectionObserver() {
  let savedCallback: IOCallback | null = null
  let savedEl: Element | null = null
  let constructorCallCount = 0

  class MockIO {
    constructor(cb: IOCallback) {
      savedCallback = cb
      constructorCallCount++
    }
    observe = vi.fn((el: Element) => { savedEl = el })
    disconnect = vi.fn()
    unobserve = vi.fn()
  }

  vi.stubGlobal('IntersectionObserver', MockIO)

  return {
    getConstructorCallCount: () => constructorCallCount,
    triggerIntersection: (isIntersecting: boolean) => {
      if (!savedCallback || !savedEl) return
      savedCallback(
        [{ isIntersecting, target: savedEl } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      )
    },
  }
}

// ── Scroll container helper ───────────────────────────────────────────────────

function createScrollContainer(scrollHeight = 1000, scrollTop = 200) {
  const state = { scrollHeight, scrollTop }
  const el = document.createElement('div')

  Object.defineProperty(el, 'scrollHeight', {
    get: () => state.scrollHeight,
    configurable: true,
  })
  Object.defineProperty(el, 'scrollTop', {
    get: () => state.scrollTop,
    set: (v: number) => { state.scrollTop = v },
    configurable: true,
  })

  return { el, state }
}

// ── Test component ───────────────────────────────────────────────────────────
// renderHook does not attach refs to real DOM, so loadPreviousRef.current would be null.
// Use a wrapper component that renders the hook so the sentinel div gets a real ref.

interface HarnessProps {
  containerEl: HTMLElement
  hasPreviousPage?: boolean
  isFetchingPreviousPage?: boolean
  fetchPreviousPage?: () => void
  enabled?: boolean
  preserveScrollOffset?: boolean
  dependency?: unknown
  rootMargin?: string
}

function ReverseScrollHarness(props: HarnessProps) {
  const {
    containerEl,
    hasPreviousPage,
    isFetchingPreviousPage,
    fetchPreviousPage,
    enabled = true,
    preserveScrollOffset = true,
    dependency,
    rootMargin,
  } = props
  const containerRef = useRef<HTMLElement>(containerEl)
  const { loadPreviousRef } = useReverseInfiniteScroll({
    containerRef,
    hasPreviousPage,
    isFetchingPreviousPage,
    fetchPreviousPage,
    enabled,
    preserveScrollOffset,
    dependency,
    rootMargin,
  })
  return React.createElement('div', { ref: loadPreviousRef })
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('useReverseInfiniteScroll', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calls fetchPreviousPage when sentinel is visible and conditions are met', () => {
    const { triggerIntersection } = setupIntersectionObserver()
    const fetchPreviousPage = vi.fn()
    const { el } = createScrollContainer()

    render(
      React.createElement(ReverseScrollHarness, {
        containerEl: el,
        hasPreviousPage: true,
        isFetchingPreviousPage: false,
        fetchPreviousPage,
        enabled: true,
      }),
    )

    act(() => { triggerIntersection(true) })

    expect(fetchPreviousPage).toHaveBeenCalledTimes(1)
  })

  it('prevents duplicate fetch when isFetchingPreviousPage=true', () => {
    const { triggerIntersection } = setupIntersectionObserver()
    const fetchPreviousPage = vi.fn()
    const { el } = createScrollContainer()

    render(
      React.createElement(ReverseScrollHarness, {
        containerEl: el,
        hasPreviousPage: true,
        isFetchingPreviousPage: true,
        fetchPreviousPage,
        enabled: true,
      }),
    )

    act(() => { triggerIntersection(true) })

    expect(fetchPreviousPage).not.toHaveBeenCalled()
  })

  it('calls fetch only once even when the same observer callback fires repeatedly before prop update', () => {
    const { triggerIntersection } = setupIntersectionObserver()
    const fetchPreviousPage = vi.fn()
    const { el } = createScrollContainer()

    render(
      React.createElement(ReverseScrollHarness, {
        containerEl: el,
        hasPreviousPage: true,
        isFetchingPreviousPage: false,
        fetchPreviousPage,
        enabled: true,
      }),
    )

    act(() => {
      triggerIntersection(true)
      triggerIntersection(true)
    })

    expect(fetchPreviousPage).toHaveBeenCalledTimes(1)
  })

  it('does not fetch when hasPreviousPage=false', () => {
    const { triggerIntersection } = setupIntersectionObserver()
    const fetchPreviousPage = vi.fn()
    const { el } = createScrollContainer()

    render(
      React.createElement(ReverseScrollHarness, {
        containerEl: el,
        hasPreviousPage: false,
        isFetchingPreviousPage: false,
        fetchPreviousPage,
        enabled: true,
      }),
    )

    act(() => { triggerIntersection(true) })

    expect(fetchPreviousPage).not.toHaveBeenCalled()
  })

  it('does not create IntersectionObserver when enabled=false', () => {
    const { getConstructorCallCount } = setupIntersectionObserver()
    const { el } = createScrollContainer()

    render(
      React.createElement(ReverseScrollHarness, {
        containerEl: el,
        hasPreviousPage: true,
        fetchPreviousPage: vi.fn(),
        enabled: false,
      }),
    )

    expect(getConstructorCallCount()).toBe(0)
  })

  it('does not fetch when isIntersecting=false', () => {
    const { triggerIntersection } = setupIntersectionObserver()
    const fetchPreviousPage = vi.fn()
    const { el } = createScrollContainer()

    render(
      React.createElement(ReverseScrollHarness, {
        containerEl: el,
        hasPreviousPage: true,
        isFetchingPreviousPage: false,
        fetchPreviousPage,
        enabled: true,
      }),
    )

    act(() => { triggerIntersection(false) })

    expect(fetchPreviousPage).not.toHaveBeenCalled()
  })

  it('adjusts scrollTop by delta when dependency changes after prepend', () => {
    const { triggerIntersection } = setupIntersectionObserver()
    const { el, state } = createScrollContainer(1000, 200)

    const { rerender } = render(
      React.createElement(ReverseScrollHarness, {
        containerEl: el,
        hasPreviousPage: true,
        isFetchingPreviousPage: false,
        fetchPreviousPage: vi.fn(),
        preserveScrollOffset: true,
        dependency: 'v1',
        enabled: true,
      }),
    )

    // trigger fetch → previousHeightRef.current = 1000
    act(() => { triggerIntersection(true) })

    // simulate prepend: scrollHeight 1000→1300
    state.scrollHeight = 1300

    // dependency change → correction effect runs → scrollTop += (1300-1000)=300 → 500
    act(() => {
      rerender(
        React.createElement(ReverseScrollHarness, {
          containerEl: el,
          hasPreviousPage: true,
          isFetchingPreviousPage: false,
          fetchPreviousPage: vi.fn(),
          preserveScrollOffset: true,
          dependency: 'v2',
          enabled: true,
        }),
      )
    })

    expect(state.scrollTop).toBe(500)
  })

  it('does not adjust scrollTop on dependency change when preserveScrollOffset=false', () => {
    const { triggerIntersection } = setupIntersectionObserver()
    const { el, state } = createScrollContainer(1000, 200)

    const { rerender } = render(
      React.createElement(ReverseScrollHarness, {
        containerEl: el,
        hasPreviousPage: true,
        isFetchingPreviousPage: false,
        fetchPreviousPage: vi.fn(),
        preserveScrollOffset: false,
        dependency: 'v1',
        enabled: true,
      }),
    )

    act(() => { triggerIntersection(true) })
    state.scrollHeight = 1300

    act(() => {
      rerender(
        React.createElement(ReverseScrollHarness, {
          containerEl: el,
          hasPreviousPage: true,
          isFetchingPreviousPage: false,
          fetchPreviousPage: vi.fn(),
          preserveScrollOffset: false,
          dependency: 'v2',
          enabled: true,
        }),
      )
    })

    expect(state.scrollTop).toBe(200)
  })

  it('does not adjust scrollTop when scrollHeight delta is 0 or negative', () => {
    const { triggerIntersection } = setupIntersectionObserver()
    const { el, state } = createScrollContainer(1000, 200)

    const { rerender } = render(
      React.createElement(ReverseScrollHarness, {
        containerEl: el,
        hasPreviousPage: true,
        isFetchingPreviousPage: false,
        fetchPreviousPage: vi.fn(),
        preserveScrollOffset: true,
        dependency: 'v1',
        enabled: true,
      }),
    )

    act(() => { triggerIntersection(true) })
    // no scrollHeight change

    act(() => {
      rerender(
        React.createElement(ReverseScrollHarness, {
          containerEl: el,
          hasPreviousPage: true,
          isFetchingPreviousPage: false,
          fetchPreviousPage: vi.fn(),
          preserveScrollOffset: true,
          dependency: 'v2',
          enabled: true,
        }),
      )
    })

    expect(state.scrollTop).toBe(200)
  })

  it('does not recreate observer when isFetching changes after fetch completes (ref pattern)', () => {
    const { getConstructorCallCount, triggerIntersection } = setupIntersectionObserver()
    const fetchPreviousPage = vi.fn()
    const { el } = createScrollContainer()

    const { rerender } = render(
      React.createElement(ReverseScrollHarness, {
        containerEl: el,
        hasPreviousPage: true,
        isFetchingPreviousPage: false,
        fetchPreviousPage,
        enabled: true,
      }),
    )

    act(() => { triggerIntersection(true) })
    expect(fetchPreviousPage).toHaveBeenCalledTimes(1)

    const creationCountBefore = getConstructorCallCount()

    // isFetching: false→true→false (fetch completion scenario)
    act(() => {
      rerender(
        React.createElement(ReverseScrollHarness, {
          containerEl: el,
          hasPreviousPage: true,
          isFetchingPreviousPage: true,
          fetchPreviousPage,
          enabled: true,
        }),
      )
    })
    act(() => {
      rerender(
        React.createElement(ReverseScrollHarness, {
          containerEl: el,
          hasPreviousPage: true,
          isFetchingPreviousPage: false,
          fetchPreviousPage,
          enabled: true,
        }),
      )
    })

    // ref pattern: no observer recreation because isFetchingPreviousPage is not in observer deps
    expect(getConstructorCallCount()).toBe(creationCountBefore)
  })
})
