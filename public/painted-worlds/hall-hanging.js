import { BoxGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry } from './vendor/three-gallery.js'

// The original GLB uses Y-up metres. The diagonal follows its visible limewash
// face, and the rear wall hangs just in front of the z = -4.38 m surface.
const walls = {
  diagonal: { origin: [-1.708, 2.25, -1.412], yaw: 1.004, span: [-1.94, .68], gap: .19, width: 1.39 },
  rear: { origin: [0, 2.34, -4.371], yaw: 0, span: [-.91, 3.34], gap: .29, width: 1.79 }
}
const wallViews = {
  diagonal: { position: [1.21, 2.17, 1.68], target: [-2.06, 2.20, -.86], halfWidth: 1.60 },
  rear: { position: [1.65, 2.18, 1.93], target: [1.20, 2.27, -4.37], halfWidth: 2.30 }
}
const matWidth = .061
const railWidth = .041
const margin = 2 * (matWidth + railWidth)

export function getHallWallView(wall, aspect) {
  const { position, target, halfWidth } = wallViews[wall]
  const distance = Math.hypot(...position.map((coordinate, axis) => coordinate - target[axis]))
  const halfHeight = Math.max(1.12, halfWidth / aspect)
  return { position, target, fov: 360 / Math.PI * Math.atan(halfHeight / distance) }
}

function layoutWall(entries, name) {
  if (!entries.length) return []
  const wall = walls[name]
  const [min, max] = wall.span
  const gapWidth = Math.max(0, entries.length - 1) * wall.gap
  const sizes = entries.map(entry => {
    const ratio = entry.width / entry.height
    const height = Math.min(1.56, wall.width / ratio)
    return { ...entry, width: height * ratio, height }
  })
  const artworkWidth = sizes.reduce((sum, work) => sum + work.width, 0)
  const frameWidth = sizes.length * margin
  const scale = Math.min(1, (max - min - gapWidth - frameWidth) / artworkWidth)
  let cursor = (min + max - (artworkWidth * scale + frameWidth + gapWidth)) / 2
  return sizes.map(work => {
    const width = work.width * scale
    const height = work.height * scale
    const center = cursor + (width + margin) / 2
    cursor += width + margin + wall.gap
    const [x, y, z] = wall.origin
    return { ...work, width, height, wall: name, yaw: wall.yaw,
      position: [x + Math.cos(wall.yaw) * center, y, z - Math.sin(wall.yaw) * center] }
  })
}

export function layoutHallArt(entries) {
  if (!entries.length) return []
  const [first, ...rest] = entries
  // Spread chronological endpoints across the diagonal, with the middle works
  // hung on the rear wall. Every year comes from the shared work registry.
  const last = rest.pop()
  return [...layoutWall(last ? [first, last] : [first], 'diagonal'), ...layoutWall(rest, 'rear')]
}

export function createHallArt(entries, beforeShadow) {
  const hanging = new Group()
  const face = new PlaneGeometry()
  const block = new BoxGeometry()
  const wood = new MeshStandardMaterial({ color: 0x573b2c, roughness: .71 })
  const board = new MeshBasicMaterial({ color: 0xe7dfcd, toneMapped: false })

  for (const item of layoutHallArt(entries)) {
    const { work, texture, width, height, position, yaw } = item
    const painting = new Group()
    painting.userData.paintingId = work.id
    painting.position.fromArray(position)
    painting.rotation.y = yaw
    const mountWidth = width + 2 * matWidth
    const mountHeight = height + 2 * matWidth

    const mount = new Mesh(face, board)
    mount.position.z = .025
    mount.scale.set(mountWidth, mountHeight, 1)
    const image = new Mesh(face, new MeshBasicMaterial({ map: texture, toneMapped: false }))
    image.position.z = .028
    image.scale.set(width, height, 1)
    painting.add(mount, image)

    function rail(x, y, w, h) {
      const beam = new Mesh(block, wood)
      beam.position.set(x, y, .032)
      beam.scale.set(w, h, .064)
      beam.castShadow = true
      beam.receiveShadow = true
      beam.onBeforeShadow = beforeShadow
      painting.add(beam)
    }
    const side = (mountWidth + railWidth) / 2
    const top = (mountHeight + railWidth) / 2
    rail(-side, 0, railWidth, mountHeight)
    rail(side, 0, railWidth, mountHeight)
    rail(0, top, mountWidth + 2 * railWidth, railWidth)
    rail(0, -top, mountWidth + 2 * railWidth, railWidth)
    hanging.add(painting)
  }
  return hanging
}

// Old frame profiles and plaque supports share meshes with the architecture.
// Keep triangles outside the two former mounts' bounds in GLB world space.
const oldMounts = [
  [[-2.14, .97, -2.07], [-1.23, 3.08, -.73]],
  [[.87, 1.60, -4.47], [2.67, 3.83, -4.27]]
]

function liftBakedFrameShadows(geometry) {
  const { position, color } = geometry.attributes
  if (!color) return
  // Keep the limewash texture and lift only the dark vertex colours baked
  // around the old mounts, using the adjacent wall brightness as a floor.
  const patches = [
    { wall: walls.diagonal, depth: -2.218, u: [-.83, .81], y: [.94, 3.22], light: .91 },
    { wall: walls.rear, depth: -4.38, u: [.68, 2.70], y: [1.56, 4.01], light: .66 }
  ]
  for (const { wall, depth, u, y, light } of patches) {
    const sin = Math.sin(wall.yaw)
    const cos = Math.cos(wall.yaw)
    for (let i = 0; i < position.count; i++) {
      const height = position.getY(i)
      if (height < y[0] || height > y[1]) continue
      const x = position.getX(i)
      const z = position.getZ(i)
      if (Math.abs(x * sin + z * cos - depth) > .009) continue
      const along = (x - wall.origin[0]) * cos - (z - wall.origin[2]) * sin
      const red = color.getX(i)
      if (along < u[0] || along > u[1] || red >= light || red === 0) continue
      const gain = light / red
      color.setXYZ(i, light, Math.min(1, color.getY(i) * gain), Math.min(1, color.getZ(i) * gain))
    }
  }
  color.needsUpdate = true
}

export function removeOldHallArt(hall) {
  // GLTFLoader normalizes spaces and punctuation in node names.
  const words = node => node.name.toLowerCase().replace(/[^a-z]+/g, ' ').trim()
  const retired = hall.children.filter(node => node.name.startsWith('portal_') || words(node) === 'labels original works')
  hall.remove(...retired)
  const mountMeshes = new Set(['oak secondary joinery', 'recesses bronze and joints', 'brass ferrules and inlay'])
  for (const mesh of hall.children.filter(node => mountMeshes.has(words(node)))) {
    const geometry = mesh.geometry
    if (!geometry?.index) continue
    const { index, attributes: { position } } = geometry
    const inside = (i, min, max) => position.getX(i) >= min[0] && position.getX(i) <= max[0] &&
      position.getY(i) >= min[1] && position.getY(i) <= max[1] && position.getZ(i) >= min[2] && position.getZ(i) <= max[2]
    const kept = []
    for (let i = 0; i < index.count; i += 3) {
      const triangle = [index.getX(i), index.getX(i + 1), index.getX(i + 2)]
      if (!oldMounts.some(([min, max]) => triangle.every(j => inside(j, min, max)))) kept.push(...triangle)
    }
    geometry.setIndex(kept)
  }
  const limewash = hall.children.find(node => words(node) === 'lime exhibition walls')
  if (limewash?.geometry) liftBakedFrameShadows(limewash.geometry)
  return retired
}
