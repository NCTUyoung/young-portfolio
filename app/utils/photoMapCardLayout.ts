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
