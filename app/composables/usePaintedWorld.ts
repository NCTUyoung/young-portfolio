import type { InjectionKey } from 'vue'

export const paintedWorldOpenKey: InjectionKey<(anchor: HTMLAnchorElement) => boolean> = Symbol('openPaintedWorld')
