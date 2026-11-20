import * as T from './vendor/three-gallery.js'

const palettes = {
  hall: { sky: 0xd9d5c9, hemisphere: 1.12, ground: 0xb9a184, key: 0xffeed6, power: 2.83, fill: 0xdce6ef, bounce: .64, sun: [-2.65, 8.5, 4.3], shadow: .57 },
  orchard: { sky: 0xf7e8c6, hemisphere: 1.02, ground: 0x758c73, key: 0xffe7ac, power: 2.75, fill: 0xd5e6ca, bounce: .64, sun: [5.6, 8.1, -9.5] },
  stage: { sky: 0x2a0714, hemisphere: .52, ground: 0x79354a, key: 0xffddd1, power: 1.15, fill: 0xbacbde, bounce: .56, sun: [-3, 6, 3] }
}
const sculptureLighting = { hemisphere: 1.12, ground: 0xa59a89, power: 2.15, bounce: .40, sun: [-4.5, 7, 3], shadow: .77 }
const roomDefaults = { sky: 0xd9d5c9, ground: 0xa59a89, key: 0xffeed6, fill: 0xdce6ef, keyIntensity: 2.15, fillIntensity: .55, skyIntensity: 1.05 }

function omitOpaqueShadowMaps(_renderer, _object, _camera, _shadowCamera, _geometry, depthMaterial) {
  // The shared depth material can otherwise retain a disposed room's color map in its uniforms.
  if (depthMaterial.alphaTest > 0) return
  depthMaterial.map = null
  depthMaterial.alphaMap = null
}

function disposeAssets(objects, extraTextures = []) {
  const geometry = new Set()
  const materials = new Set()
  const skeletons = new Set()
  for (const object of objects) object?.traverse(node => {
    if (node.geometry) geometry.add(node.geometry)
    if (node.material) for (const material of [node.material].flat()) materials.add(material)
    if (node.skeleton) skeletons.add(node.skeleton)
  })
  const textures = new Set(extraTextures.filter(Boolean))
  for (const material of materials) {
    for (const value of Object.values(material)) if (value?.isTexture) textures.add(value)
    material.dispose()
  }
  for (const object of [...geometry, ...skeletons]) object.dispose()
  const bitmaps = new Set()
  for (const texture of textures) {
    if (texture.image?.close) bitmaps.add(texture.image)
    texture.dispose()
  }
  for (const bitmap of bitmaps) bitmap.close()
}

export function createExhibition(canvas, data, enterPainting) {
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6))
  renderer.outputColorSpace = T.SRGBColorSpace
  renderer.toneMapping = T.ACESFilmicToneMapping
  renderer.shadowMap.enabled = true
  renderer.shadowMap.autoUpdate = false
  renderer.shadowMap.type = T.PCFSoftShadowMap
  const scene = new T.Scene()
  const camera = new T.PerspectiveCamera(52, 1, .035, 140)
  // Keep orbit input at its requested radius while the displayed lens clears scenery.
  const displayCamera = camera.clone()
  const obstructionRay = new T.Raycaster()
  const sightline = new T.Vector3()
  const blockers = []
  const foliage = []
  const orbit = new T.OrbitControls(camera, canvas)
  orbit.enablePan = false
  orbit.enableDamping = false
  orbit.minDistance = .45
  orbit.maxDistance = 18
  orbit.minPolarAngle = .15
  orbit.maxPolarAngle = Math.PI * .81
  const hemi = new T.HemisphereLight(0xffffff, 0xb0a18e, 1.5)
  const key = new T.DirectionalLight()
  const fill = new T.DirectionalLight()
  fill.position.set(2.5, 3, 4)
  key.castShadow = true
  const shadowSize = Math.min(renderer.capabilities.maxTextureSize, matchMedia('(max-width: 650px)').matches ? 1536 : 2048)
  key.shadow.mapSize.set(shadowSize, shadowSize)
  Object.assign(key.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: .2, far: 32 })
  key.shadow.bias = -.00015
  key.shadow.normalBias = .012
  const exhibitLight = new T.PointLight(0xffeed6, 2.2, 4)
  exhibitLight.position.set(-.85, 2.45, .95)
  const stageLight = new T.SpotLight(0xffd6cb, 34, 12, .49, .82)
  stageLight.position.set(-.72, 4.12, 2.39)
  stageLight.target.position.set(.10, 1.12, .80)
  stageLight.castShadow = true
  stageLight.shadow.mapSize.set(1024, 1024)
  stageLight.shadow.camera.near = .3
  stageLight.shadow.camera.far = 9
  stageLight.shadow.bias = -.00012
  stageLight.shadow.normalBias = .002
  const curtainLight = new T.PointLight(0xff625b, 27, 9)
  curtainLight.position.set(-2.3, 3.4, .65)
  const skirtFill = new T.PointLight(0xa5e0e8, 2.9, 3.4)
  skirtFill.position.set(-.93, .80, 1.64)
  const portraitFill = new T.PointLight()
  const canopySun = new T.SpotLight(0xffe7ac, 151, 5, .122, .58)
  canopySun.position.set(.56, 2.36, -10.63)
  canopySun.target.position.set(-.07, 1.483, -7.881)
  // A fixed light projection follows the folds and hand throughout the orbit.
  scene.add(canopySun, canopySun.target)
  const roseKey = new T.SpotLight(0xffadad, 13, 7, .32, .84)
  roseKey.position.set(-.33, 2.7, 3.35)
  roseKey.target.position.set(.10, 1.71, .82)
  const denimBounce = new T.PointLight(0xf1daea, 1.35, 3)
  denimBounce.position.set(.24, .71, 2.1)
  scene.add(roseKey, roseKey.target, denimBounce)
  const hairLight = new T.PointLight(0xafedff, 10.5, 5)
  hairLight.position.set(1.64, 3.12, -.73)
  scene.add(hemi, key, key.target, fill, exhibitLight, stageLight, stageLight.target, curtainLight, skirtFill, portraitFill, hairLight)
  const loader = new T.GLTFLoader().setMeshoptDecoder(T.MeshoptDecoder)
  const ray = new T.Raycaster()
  const pointer = new T.Vector2()
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  let pending = null
  let frame = 0
  let room = null
  let world = ''
  let closeupLighting = false
  let travel = null
  let start = null
  let lost = false
  let disposed = false
  const contacts = new Set()

  function draw() {
    if (room && !frame && !lost && !document.hidden) frame = requestAnimationFrame(render)
  }
  function render(time) {
    frame = 0
    if (travel) {
      const t = Math.min(1, (time - travel.time) / 680)
      const ease = t * t * (3 - 2 * t)
      camera.position.lerpVectors(travel.from, travel.to, ease)
      orbit.target.lerpVectors(travel.fromTarget, travel.target, ease)
      camera.fov = travel.fromFov + (travel.fov - travel.fromFov) * ease
      camera.updateProjectionMatrix()
      if (t === 1) {
        orbit.maxDistance = travel.limit
        travel = null
      }
      orbit.update()
    }
    displayCamera.position.copy(camera.position)
    displayCamera.quaternion.copy(camera.quaternion)
    displayCamera.fov = camera.fov
    displayCamera.aspect = camera.aspect
    displayCamera.projectionMatrix.copy(camera.projectionMatrix)
    displayCamera.projectionMatrixInverse.copy(camera.projectionMatrixInverse)
    sightline.subVectors(camera.position, orbit.target)
    const distance = sightline.length()
    if (distance > orbit.minDistance) {
      obstructionRay.set(orbit.target, sightline.divideScalar(distance))
      obstructionRay.near = .12
      obstructionRay.far = distance + .12
      let obstruction = obstructionRay.intersectObjects(blockers, false)[0]
      // Retain near-foliage parallax until a leaf reaches the viewing lens.
      if (foliage.length) {
        obstructionRay.near = Math.max(.35, distance - .82)
        const leaf = obstructionRay.intersectObjects(foliage, false)[0]
        if (leaf && (!obstruction || leaf.distance < obstruction.distance)) obstruction = leaf
      }
      if (obstruction) {
        const clearance = Math.max(.18, Math.min(distance, obstruction.distance - .14))
        displayCamera.position.copy(orbit.target).addScaledVector(sightline, clearance)
      }
    }
    displayCamera.updateMatrixWorld()
    renderer.render(scene, displayCamera)
    if (travel) draw()
  }
  function resize() {
    const { width, height } = canvas.getBoundingClientRect()
    if (!width || !height) return
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    draw()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(canvas)
  orbit.addEventListener('change', () => {
    if (Object.hasOwn(palettes, world) && camera.position.y < .32) {
      camera.position.y = .32
      camera.lookAt(orbit.target)
    }
    draw()
  })
  orbit.addEventListener('start', () => { travel = null })
  document.addEventListener('visibilitychange', draw)
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault()
    lost = true
    clear()
    canvas.dispatchEvent(new Event('exhibit-lost'))
  })
  canvas.addEventListener('webglcontextrestored', () => {
    lost = false
    canvas.dispatchEvent(new Event('exhibit-restored'))
  })

  async function model(id, signal) {
    const url = new URL(data.models[id], location.href)
    const response = await fetch(url, { signal })
    if (!response.ok) throw new Error(`Unable to load room ${id}: ${response.status}`)
    const bytes = await response.arrayBuffer()
    signal.throwIfAborted()
    const { scene: group } = await loader.parseAsync(bytes, new URL('.', url).href)
    group.traverse(node => {
      if (!node.isMesh) return
      const materials = [node.material].flat()
      const soft = materials.some(material => material.transparent)
      node.castShadow = !soft && (id === 'hall' ? /beam|rafter|bench|lintel/i.test(node.name) : !/floor|terrain|road|dais|platform|ground/i.test(node.name))
      node.receiveShadow = !soft && id !== 'statue'
      if (node.castShadow) node.onBeforeShadow = omitOpaqueShadowMaps
      if (id === 'stage') for (const material of materials) {
        if (!material.transparent) continue
        material.depthWrite = false
        if (/tapered followspot|light pool/i.test(material.name)) {
          material.blending = T.AdditiveBlending
          material.opacity = /followspot/i.test(material.name) ? 2.8 : 1.15
          material.emissiveIntensity = 1.7
          material.toneMapped = false
        }
      }
    })
    if (id === 'statue') {
      group.position.fromArray(data.sculpture.foot)
      group.rotation.y = data.sculpture.yaw * Math.PI / 180
      group.scale.setScalar(data.sculpture.scale)
    }
    return group
  }
  function skyDome(texture) {
    const dome = new T.SphereGeometry(84, 48, 32)
    // The painted skyline sits three quarters of the way down the panorama.
    const uv = dome.attributes.uv
    for (let i = 0; i < uv.count; i++) {
      const v = uv.getY(i)
      uv.setY(i, v < .5 ? .5 * v : .25 + 1.5 * (v - .5))
    }
    const sky = new T.Mesh(dome, new T.MeshBasicMaterial({
      map: texture, side: T.BackSide, depthWrite: false, toneMapped: false, fog: false
    }))
    sky.renderOrder = -2
    return sky
  }
  async function loadTexture(url, signal, reflection = false) {
    if (!url) return null
    try {
      const response = await fetch(url, { signal })
      if (!response.ok) return null
      const blob = await response.blob()
      signal.throwIfAborted()
      const objectURL = URL.createObjectURL(blob)
      try {
        const texture = await new T.TextureLoader().loadAsync(objectURL)
        if (signal.aborted) {
          texture.dispose()
          return null
        }
        if (reflection || url === data.sky) texture.colorSpace = T.SRGBColorSpace
        if (reflection) texture.mapping = T.EquirectangularReflectionMapping
        return texture
      } finally {
        URL.revokeObjectURL(objectURL)
      }
    } catch {
      return null
    }
  }
  function clear() {
    pending?.abort()
    pending = null
    travel = null
    cancelAnimationFrame(frame)
    frame = 0
    contacts.clear()
    start = null
    if (!room) return
    scene.remove(room)
    disposeAssets([room], [scene.environment, canopySun.map])
    room = null
    world = ''
    scene.environment = null
    canopySun.map = null
    blockers.length = 0
    foliage.length = 0
    // Release the render list references and the stage-only shadow target.
    renderer.renderLists.dispose()
    stageLight.shadow.dispose()
    stageLight.shadow.map = null
  }
  function aimLights(rig) {
    hemi.intensity = rig.hemisphere
    key.intensity = rig.power
    key.position.fromArray(rig.sun)
    fill.intensity = rig.bounce
    renderer.shadowMap.needsUpdate = true
  }
  function setView(view, animated = false) {
    if (world === 'hall' && closeupLighting !== (view === data.figureView)) {
      closeupLighting = view === data.figureView
      const rig = closeupLighting ? sculptureLighting : palettes.hall
      aimLights(rig)
      hemi.groundColor.setHex(rig.ground)
      key.shadow.intensity = rig.shadow
      scene.environmentIntensity = closeupLighting ? 0 : .35
    }
    const to = new T.Vector3(...view.position)
    const target = new T.Vector3(...view.target)
    const distance = to.distanceTo(target)
    const legacy = Object.hasOwn(palettes, world)
    const limit = legacy ? Math.min(18, distance * 1.4) : distance * 1.65
    orbit.minDistance = legacy ? .45 : Math.min(.45, distance * .45)
    camera.near = Math.min(.035, distance / 10)
    camera.far = Math.max(140, distance * 8, scene.fog?.far ?? 0)
    const fov = view.fov ?? view.fovDegrees ?? 52
    if (animated && !reduced.matches) {
      orbit.maxDistance = Math.max(limit, camera.position.distanceTo(orbit.target))
      travel = { from: camera.position.clone(), fromTarget: orbit.target.clone(), fromFov: camera.fov,
        to, target, fov, limit, time: performance.now() }
    } else {
      travel = null
      orbit.maxDistance = limit
      camera.position.copy(to)
      orbit.target.copy(target)
      camera.fov = fov
      camera.updateProjectionMatrix()
      orbit.update()
    }
    draw()
  }
  async function show(id, view) {
    clear()
    if (lost || disposed) return false
    const task = new AbortController()
    pending = task
    const { signal } = task
    const hall = id === 'hall'
    const orchard = id === 'orchard'
    const stage = id === 'stage'
    const reflection = data.reflections?.[id]
    const loaded = await Promise.allSettled([
      model(id, signal), hall ? model('statue', signal) : null,
      loadTexture(reflection, signal, true), orchard ? loadTexture(data.canopyLight, signal) : null,
      orchard && data.sky !== reflection ? loadTexture(data.sky, signal) : null
    ])
    const [primary, statue, environment, sunflecks, sky] = loaded.map(result => result.value)
    if (signal.aborted || !primary || (hall && !statue)) {
      disposeAssets([primary, statue], [environment, sunflecks, sky])
      if (signal.aborted) return false
      pending = null
      throw loaded.find(result => result.status === 'rejected').reason
    }
    pending = null
    room = new T.Group()
    room.add(primary)
    if (statue) room.add(statue)
    const panorama = sky ?? environment
    if (orchard && panorama) room.add(skyDome(panorama))
    scene.add(room)
    room.updateMatrixWorld(true)
    const legacy = Object.hasOwn(palettes, id)
    if (legacy) primary.traverse(node => {
      if (!node.isMesh) return
      const surface = [node.material].flat().map(material => material.name).join(' ')
      const solid = hall ? /limewash|sawn oak|honed fossil limestone/i.test(surface)
        : orchard ? /bark|trunk/i.test(surface)
        : /garnet inks|wine ink|dyed reverse|carbon at overlaps|carmine glaze/i.test(surface)
      if (solid) blockers.push(node)
      if (orchard && /citron green|leaf blades|waxy citrus lamina/i.test(surface)) foliage.push(node)
    })
    world = id
    closeupLighting = false
    scene.environment = environment
    scene.environmentIntensity = stage ? 1.04 : orchard ? .61 : .35
    hemi.color.setHex(0xffffff)
    let radius
    let shadowFar
    if (legacy) {
      const p = palettes[id]
      scene.background = new T.Color(p.sky)
      scene.fog = orchard ? new T.Fog(0xffeac2, 9.2, 36) : null
      key.target.position.set(0, 0, orchard ? -7.7 : 0)
      aimLights(p)
      hemi.groundColor.setHex(p.ground)
      key.color.setHex(p.key)
      fill.color.setHex(p.fill)
      fill.position.set(2.5, 3, 4)
      key.shadow.intensity = hall ? p.shadow : 1
      radius = orchard ? 11 : 6
      shadowFar = 32
    } else {
      const look = { ...roomDefaults, ...data.rooms[id].look }
      const { fog } = look
      scene.background = new T.Color(look.sky)
      scene.fog = fog ? new T.Fog(fog.color, fog.near, fog.far) : null
      hemi.intensity = look.skyIntensity
      hemi.groundColor.set(look.ground)
      key.color.set(look.key)
      key.intensity = look.keyIntensity
      fill.color.set(look.fill)
      fill.intensity = look.fillIntensity
      // Keep the rig centered on the authored view even in off-origin rooms.
      const firstView = data.rooms[id].views[0]
      key.target.position.fromArray(firstView.target)
      const distance = new T.Vector3(...firstView.position).distanceTo(key.target.position)
      radius = Math.max(2, distance * 1.6)
      shadowFar = radius * 5
      key.position.set(-.65, 1.25, .72).multiplyScalar(radius).add(key.target.position)
      fill.position.set(.5, .65, .8).multiplyScalar(radius).add(key.target.position)
      key.shadow.intensity = 1
      renderer.shadowMap.needsUpdate = true
    }
    Object.assign(key.shadow.camera, { left: -radius, right: radius, top: radius, bottom: -radius, far: shadowFar })
    key.shadow.camera.updateProjectionMatrix()
    canopySun.map = sunflecks
    canopySun.visible = !!sunflecks
    exhibitLight.visible = hall
    roseKey.visible = denimBounce.visible = stageLight.visible = stage
    curtainLight.visible = skirtFill.visible = hairLight.visible = stage
    portraitFill.visible = orchard || stage
    if (stage) {
      portraitFill.position.set(1.6, 3.2, 3.9)
      portraitFill.color.setHex(0xffc3ba)
      portraitFill.intensity = 12.5
      portraitFill.distance = 7
    } else if (orchard) {
      portraitFill.position.set(.15, 2.75, -10)
      portraitFill.color.setHex(0xffefcb)
      portraitFill.intensity = 2.6
      portraitFill.distance = 5
    }
    resize()
    setView(view)
    return true
  }
  function move(direction) {
    travel = null
    const offset = camera.position.clone().sub(orbit.target)
    if (direction === 'left' || direction === 'right') {
      offset.applyAxisAngle(new T.Vector3(0,1,0), direction === 'left' ? -.18 : .18)
    } else {
      offset.setLength(T.MathUtils.clamp(offset.length() * (direction === 'near' ? .84 : 1.18), orbit.minDistance, orbit.maxDistance))
    }
    camera.position.copy(orbit.target).add(offset)
    orbit.update()
    draw()
  }
  canvas.addEventListener('pointerdown', event => {
    contacts.add(event.pointerId)
    start = contacts.size === 1 ? [event.clientX, event.clientY] : null
  })
  canvas.addEventListener('pointercancel', event => { contacts.delete(event.pointerId); start = null })
  canvas.addEventListener('pointerup', event => {
    contacts.delete(event.pointerId)
    const origin = start
    start = null
    if (!origin || event.button !== 0 || world !== 'hall' || Math.hypot(event.clientX - origin[0], event.clientY - origin[1]) > 7) return
    const b = canvas.getBoundingClientRect()
    pointer.set(2 * (event.clientX - b.left) / b.width - 1, 1 - 2 * (event.clientY - b.top) / b.height)
    ray.setFromCamera(pointer,displayCamera)
    const hit = ray.intersectObjects(room.children,true)[0]
    for (let n=hit?.object; n && n!==room; n=n.parent) {
      for (const [id,portal] of Object.entries(data.portals)) {
        if (n.name.includes(portal.mesh)) { enterPainting(id); return }
      }
    }
  })
  window.addEventListener('pagehide', event => {
    if (event.persisted) return
    disposed = true
    clear()
    observer.disconnect()
    orbit.dispose()
    document.removeEventListener('visibilitychange', draw)
    key.shadow.dispose()
    renderer.dispose()
  })
  resize()
  return { show, setView, move, clear }
}
