export interface LayoutRect {
  left: number
  top: number
  right: number
  bottom: number
}

/** Treat nearby cards as collisions so photo labels keep a small clear gutter. */
export function rectanglesOverlap (a: LayoutRect, b: LayoutRect, gutter = 10): boolean {
  return a.left < b.right + gutter
    && a.right + gutter > b.left
    && a.top < b.bottom + gutter
    && a.bottom + gutter > b.top
}

/** Find where a connector should meet a card edge from its map anchor. */
export function cardEdge (
  x: number,
  y: number,
  left: number,
  top: number,
  width: number,
  height: number
) {
  const edgeX = Math.max(left, Math.min(x, left + width))
  const edgeY = Math.max(top, Math.min(y, top + height))
  if (edgeX === x && edgeY === y) return { x: left + width / 2, y: top + height }
  return { x: edgeX, y: edgeY }
}

/** Three loose prints surround an open map center; narrow screens retain two. */
export function layoutMapPrints (width: number, height: number, ratios: number[]) {
  const mobile = width < 640
  const inset = mobile ? 16 : 40
  return ratios.slice(0, mobile ? 2 : 3).map((value, index) => {
    const ratio = Number.isFinite(value) && value > 0 ? value : 1
    const caption = index === 0 ? (mobile ? 82 : 94) : 44
    const padding = mobile ? 14 : 20
    const maxHeight = index === 0 ? height - 2 * inset - 32 : (height - 100) / 2
    const maxWidth = index === 0
      ? Math.min(280, width / 2 - 36)
      : Math.min(mobile ? 130 : 220, width * (mobile ? .38 : .23))
    const paperWidth = Math.max(40, Math.min(maxWidth, (maxHeight - caption - padding) * ratio + padding))
    const paperHeight = (paperWidth - padding) / ratio + caption + padding
    const left = index === 0 ? width - paperWidth - inset : (mobile ? inset : Math.max(88, width * (index === 1 ? .14 : .07)))
    const top = index === 0 ? inset : index === 1 && !mobile ? 28 : height - paperHeight - 48
    return { left, top, width: paperWidth, height: paperHeight, rotation: index === 0 ? 2 : index === 1 ? -3 : -2 }
  })
}
