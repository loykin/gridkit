import React, { useRef } from 'react'
import { render, act } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { useReverseInfiniteScroll } from '../useReverseInfiniteScroll'

// ── IntersectionObserver mock ────────────────────────────────────────────────
// vi.fn()은 화살표 함수로 구현하면 constructor로 사용할 수 없으므로 class를 사용한다.

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

// ── 스크롤 컨테이너 헬퍼 ─────────────────────────────────────────────────────

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

// ── 테스트 컴포넌트 ──────────────────────────────────────────────────────────
// renderHook은 ref를 실제 DOM에 연결하지 않으므로 loadPreviousRef.current가 null이다.
// hook을 직접 렌더링하는 컴포넌트를 통해 sentinel div에 ref를 연결한다.

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

// ── 테스트 ───────────────────────────────────────────────────────────────────

describe('useReverseInfiniteScroll', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sentinel이 보이고 조건 충족 시 fetchPreviousPage 호출', () => {
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

  it('isFetchingPreviousPage=true이면 중복 fetch 방지', () => {
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

  it('prop 업데이트 전 같은 observer callback이 반복되어도 fetch는 한 번만 호출', () => {
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

  it('hasPreviousPage=false이면 fetch 안 함', () => {
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

  it('enabled=false이면 IntersectionObserver를 생성하지 않음', () => {
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

  it('isIntersecting=false이면 fetch 안 함', () => {
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

  it('prepend 후 dependency 변화 시 scrollTop을 delta만큼 보정', () => {
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

    // fetch 트리거 → previousHeightRef.current = 1000
    act(() => { triggerIntersection(true) })

    // prepend 시뮬레이션: scrollHeight 1000→1300
    state.scrollHeight = 1300

    // dependency 변화 → 보정 effect 실행 → scrollTop += (1300-1000)=300 → 500
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

  it('preserveScrollOffset=false이면 dependency 변화 시 scrollTop 보정 안 함', () => {
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

  it('scrollHeight delta가 0 이하이면 scrollTop 보정 안 함', () => {
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
    // scrollHeight 변화 없음

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

  it('fetch 완료 후 isFetching 변화 시 observer를 재생성하지 않음 (ref 패턴)', () => {
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

    // isFetching: false→true→false (fetch 완료 시나리오)
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

    // ref 패턴: isFetchingPreviousPage가 observer deps에 없으므로 재생성 없음
    expect(getConstructorCallCount()).toBe(creationCountBefore)
  })
})
