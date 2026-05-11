import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { useStickToBottom } from '../useStickToBottom'

// jsdom에서 scrollHeight/clientHeight는 항상 0이므로 직접 override해서 시뮬레이션한다.
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

  it('초기 atBottom 상태는 항상 true (mount 시 stick 가정)', () => {
    // 스크롤 위치와 무관하게 초기 atBottom=true: mount 시 하단으로 스크롤하기 위한 전제
    const el = createScrollContainer(600, 300, 0)
    const { result } = renderHook(() =>
      useStickToBottom({ containerRef: makeRef(el), threshold: 48 }),
    )
    expect(result.current.atBottom).toBe(true)
  })

  it('mount 시 enabled=true이면 scrollTop을 scrollHeight로 설정 (stick-to-bottom)', () => {
    const el = createScrollContainer(600, 300, 0)
    renderHook(({ dep }) =>
      useStickToBottom({ containerRef: makeRef(el), enabled: true, threshold: 48, dependency: dep }),
      { initialProps: { dep: 'v1' } },
    )
    // mount effect: atBottomRef=true → scrollTop = scrollHeight
    expect(el.scrollTop).toBe(600)
  })

  it('scroll 이벤트 후 top 위치이면 atBottom=false로 전환', () => {
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
    // 사용자가 위로 스크롤
    act(() => {
      mockScrollTop = 0
      el.dispatchEvent(new Event('scroll'))
    })
    expect(result.current.atBottom).toBe(false)
  })

  it('스크롤을 하단으로 내리면 atBottom=true로 전환', () => {
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

    // 상단 위치 → atBottom=false
    act(() => {
      mockScrollTop = 0
      el.dispatchEvent(new Event('scroll'))
    })
    expect(result.current.atBottom).toBe(false)

    // 하단 위치 (600-300=300, scrollTop=260 → bottom까지 40px ≤ 48)
    act(() => {
      mockScrollTop = 260
      el.dispatchEvent(new Event('scroll'))
    })
    expect(result.current.atBottom).toBe(true)
  })

  it('dependency 변화 + atBottom=true이면 scrollTop을 scrollHeight로 설정', () => {
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
    // 사용자가 하단 근처에 있다고 가정 (scrollTop=300, isNearBottom=true)
    act(() => {
      mockScrollTop = 300
      el.dispatchEvent(new Event('scroll'))
    })

    // dep 변화 → stick effect → scrollTop = scrollHeight
    act(() => {
      rerender({ dep: 'v2' })
    })

    expect(el.scrollTop).toBe(600)
  })

  it('dependency 변화 + atBottom=false이면 scrollTop 변경 없음', () => {
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

    // mount: atBottomRef=true → scrollTop=600 (stick). 그 다음 사용자가 위로 스크롤
    act(() => {
      mockScrollTop = 0  // 스크롤을 강제로 맨 위로
      el.dispatchEvent(new Event('scroll'))
    })
    // atBottom=false가 되었어야 함

    // dep 변화 → atBottom=false이므로 scrollTop 변경 없음
    act(() => {
      rerender({ dep: 'v2' })
    })

    expect(el.scrollTop).toBe(0)
  })

  it('enabled=false이면 dependency 변화 시 scrollTop 변경 없음', () => {
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

    // enabled=false → stick effect가 실행되지 않으므로 scrollTop 변경 없음
    expect(el.scrollTop).toBe(300)
  })

  it('onAtBottomChange 콜백이 상태 전환 시 호출됨', () => {
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

    // true → false로 전환
    act(() => {
      mockScrollTop = 0
      el.dispatchEvent(new Event('scroll'))
    })
    expect(onAtBottomChange).toHaveBeenCalledWith(false)

    // false → true로 전환
    act(() => {
      mockScrollTop = 260
      el.dispatchEvent(new Event('scroll'))
    })
    expect(onAtBottomChange).toHaveBeenCalledWith(true)

    expect(onAtBottomChange).toHaveBeenCalledTimes(2)
  })

  it('동일한 atBottom 상태에서는 onAtBottomChange가 중복 호출되지 않음', () => {
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

    // atBottom=true 상태에서 같은 위치로 scroll (상태 변화 없음)
    act(() => {
      mockScrollTop = 300
      el.dispatchEvent(new Event('scroll'))
    })
    act(() => {
      mockScrollTop = 280
      el.dispatchEvent(new Event('scroll'))
    })

    // atBottom 상태 변화가 없으면 콜백 호출 없음
    expect(onAtBottomChange).not.toHaveBeenCalled()
  })

  it('threshold 경계값: scrollHeight-scrollTop-clientHeight === threshold이면 atBottom=true', () => {
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
