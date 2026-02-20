import { onMounted, onUnmounted, ref } from 'vue'

/**
 * 滾動揭示 composable
 * 基於 IntersectionObserver，元素進入視窗時觸發 'revealed' class
 *
 * 用法：
 *   const { revealRef } = useScrollReveal()
 *   <div ref="revealRef" class="reveal">...</div>
 *
 * 或批量模式（自動觀察容器內所有 .reveal / .reveal-left / .reveal-right / .reveal-scale）：
 *   const { observeAll } = useScrollReveal()
 *   onMounted(() => observeAll(containerRef.value))
 */
export function useScrollReveal(options?: {
  threshold?: number
  rootMargin?: string
  once?: boolean
}) {
  const threshold = options?.threshold ?? 0.12
  const rootMargin = options?.rootMargin ?? '0px 0px -40px 0px'
  const once = options?.once ?? true

  let observer: IntersectionObserver | null = null
  const revealRef = ref<HTMLElement | null>(null)

  const createObserver = () => {
    if (typeof window === 'undefined') return null

    return new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
            if (once) {
              observer?.unobserve(entry.target)
            }
          } else if (!once) {
            entry.target.classList.remove('revealed')
          }
        })
      },
      { threshold, rootMargin }
    )
  }

  // 觀察單個元素
  const observe = (el: HTMLElement) => {
    if (!observer) observer = createObserver()
    observer?.observe(el)
  }

  // 批量觀察容器內所有 reveal 元素
  const observeAll = (container?: HTMLElement | null) => {
    const root = container || document.body
    if (!observer) observer = createObserver()

    const selectors = '.reveal, .reveal-left, .reveal-right, .reveal-scale'
    root.querySelectorAll(selectors).forEach((el) => {
      observer?.observe(el)
    })
  }

  onMounted(() => {
    if (revealRef.value) {
      observe(revealRef.value)
    }
  })

  onUnmounted(() => {
    observer?.disconnect()
    observer = null
  })

  return {
    revealRef,
    observe,
    observeAll,
  }
}
