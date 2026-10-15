export interface PhotoMapPoint {
  name: string
  x: number
  y: number
  selected?: boolean
}

export interface PhotoMapCircle {
  name: string
  x: number
  y: number
  diameter: number
  anchorX: number
  anchorY: number
  anchorVisible: boolean
}

export interface PhotoMapReservedRect {
  left: number
  top: number
  right: number
  bottom: number
}

const GUTTER = 4
const GROUP_DISTANCE = 90
const TAU = Math.PI * 2

function clamp (value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function circleTouchesRect (x: number, y: number, radius: number, rect: PhotoMapReservedRect) {
  const nearestX = clamp(x, rect.left, rect.right)
  const nearestY = clamp(y, rect.top, rect.bottom)
  return Math.hypot(x - nearestX, y - nearestY) < radius + 2
}

/** Position every activity as an independent, visible circular photograph. */
export function layoutPhotoMapCircles (
  points: PhotoMapPoint[],
  width: number,
  height: number,
  options: { inset?: boolean, reserved?: PhotoMapReservedRect[] } = {}
): PhotoMapCircle[] {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return []

  const inset = options.inset === true
  const mobile = width < 640
  const normalDiameter = inset ? 44 : mobile ? 44 : 48
  const selectedDiameter = inset ? 52 : mobile ? 56 : 64
  const margin = inset ? 4 : 8
  const reserved: PhotoMapReservedRect[] = inset ? [] : [
    { left: 0, top: 0, right: 64, bottom: 156 },
    { left: Math.max(0, width - 200), top: Math.max(0, height - 24), right: width, bottom: height }
  ]
  reserved.push(...(options.reserved ?? []))

  const source = points.map((point, index) => ({
    ...point,
    index,
    validAnchor: Number.isFinite(point.x) && Number.isFinite(point.y),
    x: Number.isFinite(point.x) ? point.x : width / 2,
    y: Number.isFinite(point.y) ? point.y : height / 2,
    diameter: point.selected ? selectedDiameter : normalDiameter
  }))

  // Connected proximity groups keep neighboring map locations together, even
  // when several events share exactly the same geographic coordinate.
  const seen = new Set<number>()
  const groups: typeof source[] = []
  for (let index = 0; index < source.length; index++) {
    if (seen.has(index)) continue
    const group: typeof source = []
    const queue = [index]
    seen.add(index)
    for (let next = 0; next < queue.length; next++) {
      const current = source[queue[next]!]!
      group.push(current)
      for (let candidate = 0; candidate < source.length; candidate++) {
        if (seen.has(candidate)) continue
        if (Math.hypot(current.x - source[candidate]!.x, current.y - source[candidate]!.y) < GROUP_DISTANCE) {
          seen.add(candidate)
          queue.push(candidate)
        }
      }
    }
    groups.push(group)
  }

  const placed: PhotoMapCircle[] = []
  const byIndex: PhotoMapCircle[] = []
  for (const group of groups) {
    const ordered = [...group].sort((a, b) => a.y - b.y || a.x - b.x || a.name.localeCompare(b.name) || a.index - b.index)
    const centroidX = group.reduce((sum, point) => sum + point.x, 0) / group.length
    const centroidY = group.reduce((sum, point) => sum + point.y, 0) / group.length
    const horizontalRoom = width / 2 - centroidX
    const verticalRoom = height / 2 - centroidY
    const direction = Math.abs(horizontalRoom) + Math.abs(verticalRoom) < 12
      ? -Math.PI / 2
      : Math.atan2(verticalRoom, horizontalRoom)

    for (let index = 0; index < ordered.length; index++) {
      const point = ordered[index]!
      const radius = point.diameter / 2
      let preferredX = point.x
      let preferredY = point.y

      if (group.length > 1) {
        // Five photographs occupy the inner arc; the remaining ones open into
        // successive wider arcs. Every member stays visible instead of turning
        // into a count badge or disappearing at the viewport edge.
        let ring = 0
        let offset = index
        let capacity = 5
        while (offset >= capacity) {
          offset -= capacity
          ring++
          capacity += 2
        }
        const ringCount = Math.min(capacity, ordered.length - (index - offset))
        const spread = Math.min(Math.PI, (ringCount - 1) * .66)
        const angle = direction - spread / 2 + (ringCount === 1 ? 0 : offset * spread / (ringCount - 1))
        const distance = 68 + ring * 58 + (point.selected ? 6 : 0)
        preferredX = centroidX + Math.cos(angle) * distance
        preferredY = centroidY + Math.sin(angle) * distance
      }

      // Map projections may be far outside the current viewport after a pan.
      // Search from its nearest visible edge rather than around a remote pixel.
      preferredX = clamp(preferredX, margin + radius, width - margin - radius)
      preferredY = clamp(preferredY, margin + radius, height - margin - radius)
      const nearbyAnchorX = clamp(point.x, 0, width)
      const nearbyAnchorY = clamp(point.y, 0, height)

      const valid = (x: number, y: number) => {
        if (x - radius < margin || x + radius > width - margin || y - radius < margin || y + radius > height - margin) return false
        if (reserved.some(rect => circleTouchesRect(x, y, radius, rect))) return false
        return placed.every(circle => Math.hypot(x - circle.x, y - circle.y) >= radius + circle.diameter / 2 + GUTTER)
      }

      const candidateState: { value: { x: number, y: number, score: number } | null } = { value: null }
      const consider = (x: number, y: number) => {
        if (!valid(x, y)) return
        const score = Math.hypot(x - preferredX, y - preferredY) + .08 * Math.hypot(x - nearbyAnchorX, y - nearbyAnchorY)
        if (!candidateState.value || score < candidateState.value.score) candidateState.value = { x, y, score }
      }
      consider(preferredX, preferredY)
      for (let distance = 12; distance <= Math.max(width, height); distance += 12) {
        const samples = Math.max(16, Math.ceil(TAU * distance / 15))
        for (let sample = 0; sample < samples; sample++) {
          const angle = TAU * sample / samples
          consider(preferredX + Math.cos(angle) * distance, preferredY + Math.sin(angle) * distance)
        }
        if (candidateState.value && candidateState.value.score < distance - 12) break
      }

      // The bounded grid covers corners missed by the radial samples. It also
      // gives a stable fallback when a location projects outside the map.
      if (!candidateState.value) {
        const step = Math.max(8, normalDiameter / 3)
        for (let y = margin + radius; y <= height - margin - radius; y += step) {
          for (let x = margin + radius; x <= width - margin - radius; x += step) consider(x, y)
        }
      }
      const fallbackX = clamp(preferredX, margin + radius, width - margin - radius)
      const fallbackY = clamp(preferredY, margin + radius, height - margin - radius)
      const position = candidateState.value ?? { x: fallbackX, y: fallbackY }
      const circle = {
        name: point.name,
        x: position.x,
        y: position.y,
        diameter: point.diameter,
        anchorX: point.x,
        anchorY: point.y,
        anchorVisible: point.validAnchor && point.x >= 0 && point.x <= width && point.y >= 0 && point.y <= height
      }
      placed.push(circle)
      byIndex[point.index] = circle
    }
  }

  return source.map(point => byIndex[point.index]!)
}
