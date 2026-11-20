const $ = selector => document.querySelector(selector)
const canvas = $('canvas')
const shell = $('#scene')
const still = $('.still')
const dialog = $('dialog')
const roomTitle = $('#room-title')
const mobile = matchMedia('(max-width: 650px)')
const reduced = matchMedia('(prefers-reduced-motion: reduce)')
const doors = new Map(Array.from(document.querySelectorAll('[data-door]'), door => [door.dataset.door, door]))
const workFiles = new Map([
  ['orchard', 'gallery/2026年電繪作品/23-編輯-4-1.jpg'],
  ['stage', 'gallery/2026年電繪作品/16-編輯-1.jpg']
])

function roomFromHash() {
  const id = location.hash.slice(1)
  return doors.has(id) ? id : 'hall'
}

const source = new URLSearchParams(location.search).get('from')
const savedWork = history.state?.paintedWorldsWork
const workOrigin = source === 'work' && (workFiles.has(savedWork) ? savedWork : roomFromHash())

function updateReturnLink() {
  const link = $('#source-return')
  if (source === 'light') $('#light-link').setAttribute('aria-current', 'location')
  if (source === 'work') $('#collection-link').setAttribute('aria-current', 'location')
  if (source === 'home') {
    link.href = '../'
    link.textContent = '回到首頁'
  } else if (source === 'light') {
    link.href = $('#light-link').href
    link.textContent = '回到繪作站'
  } else if (workFiles.has(workOrigin)) {
    // The gallery uses the full filename minus its extension as part of generateImageId.
    const imageId = 'digital-' + workFiles.get(workOrigin).replace(/\.[^/.]+$/, '')
    const gallery = new URL($('#gallery-link').href)
    gallery.searchParams.set('image', imageId)
    link.href = gallery.href
    link.textContent = '回到《' + doors.get(workOrigin).querySelector('strong').textContent + '》'
  } else {
    return
  }
  link.hidden = false
  $('#gallery-link').hidden = true
}

function rememberWorkOrigin() {
  if (workFiles.has(workOrigin) && history.state?.paintedWorldsWork !== workOrigin) {
    // Keep the original work across room changes, browser Back and reloads.
    history.replaceState({ ...history.state, paintedWorldsWork: workOrigin }, '')
  }
}

function setStill(src, mobileSrc, description) {
  const source = still.querySelector('source')
  const image = still.querySelector('img')
  if (source.getAttribute('srcset') !== mobileSrc) source.setAttribute('srcset', mobileSrc)
  if (image.getAttribute('src') !== src) image.src = src
  image.alt = description
}

async function mount() {
  let data
  let engine
  let room = 'hall'
  let station = 0
  let closeup = false
  let live = false
  let rendererSettled = false
  let revision = 0
  let approach
  const stops = $('.stations')
  const keys = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'near', ArrowDown: 'far', '+': 'near', '-': 'far' }

  function view() {
    if (room === 'hall') return closeup ? data.figureView : data.hallView[mobile.matches ? 'mobile' : 'desktop']
    const v = data.rooms[room].views[station]
    return { ...v, fov: mobile.matches ? (v.mobileFov ?? Math.min((v.fov ?? 53) + 5, 73)) : v.fov }
  }

  function selectStation(index) {
    station = index
    refresh()
    if (live) engine.setView(view(), true)
    $('#status').textContent = data.rooms[room].views[station].label
  }

  function refresh() {
    const hall = room === 'hall'
    const r = data?.rooms[room]
    const shot = hall ? Number(closeup) : station
    const point = r?.views?.[station]
    const description = point
      ? (point.description ?? r.title + '，' + point.label)
      : (closeup ? '中央雕像《唯一真神》' : '中央雕像與牆上的兩幅電繪')
    const title = r?.title ?? (hall ? '畫界迴廊' : doors.get(room).querySelector('.door-room').textContent)

    roomTitle.textContent = title
    document.title = title + '｜Young Portfolio'
    document.body.dataset.world = room
    document.body.dataset.mode = live ? 'webgl' : 'stills'
    document.body.dataset.stop = String(station)
    $('#sculpture').hidden = !hall || !r
    $('#sculpture').textContent = closeup ? '展廊全景' : '近看雕像'
    $('.room-route').hidden = hall
    $('.doors').hidden = !hall
    $('.work-plaque').hidden = !r?.art
    if (r?.art) {
      $('#work-title').textContent = r.art.title
      $('#work-title').lang = room === 'stage' ? 'en' : 'zh-Hant'
      $('#catalog').textContent = '數位繪畫　／　' + r.art.date
    }

    stops.hidden = !point
    if (r && stops.dataset.room !== room) {
      stops.dataset.room = room
      stops.replaceChildren()
      for (const [index, stop] of (r.views ?? []).entries()) {
        const button = document.createElement('button')
        button.type = 'button'
        button.textContent = stop.label
        button.setAttribute('aria-label', stop.label)
        const cue = document.createElement('span')
        cue.id = 'station-cue-' + index
        cue.className = 'station-cue'
        button.setAttribute('aria-describedby', cue.id)
        button.append(cue)
        button.onclick = () => selectStation(index)
        stops.append(button)
      }
    }
    Array.from(stops.children).forEach((button, index) => {
      button.setAttribute('aria-pressed', String(index === station))
      button.querySelector('.station-cue').textContent = index === station ? '目前站點' : index === station + 1 ? '下一站' : ''
    })

    if (!live) {
      if (r) {
        setStill(r.stills[shot], r.mobileStills?.[shot] ?? r.stills[shot], description)
      } else {
        const firstStill = hall ? 'hall' : room + '-0'
        setStill('./media/' + firstStill + '.webp', './media/' + firstStill + '-mobile.webp', hall ? description : title)
      }
    }
    still.hidden = live
    canvas.tabIndex = live ? 0 : -1
    if (live) canvas.setAttribute('aria-label', description.replace(/。$/, '') + '。可用方向鍵調整角度與遠近。')
    canvas.setAttribute('aria-hidden', String(!live))
    $('.view-tools').hidden = !live
    $('#view-caption').hidden = !point
    $('#view-caption').textContent = point ? description : ''
    $('#hint').hidden = !!point && !live
    $('#hint').textContent = live
      ? (hall ? '點選牆上的畫，或拖曳環看。' : '拖曳環看，可用雙指縮放。')
      : (hall ? '從上方門牌選擇畫中展間。' : '展間資料載入中。')
  }

  async function showScene() {
    const run = ++revision
    shell.dataset.ready = 'false'
    if (engine) {
      try {
        const shown = await engine.show(room, view())
        if (run !== revision) return
        live = shown
        if (live) engine.setView(view())
      } catch {
        if (run !== revision) return
      }
    }
    refresh()
    shell.dataset.ready = 'true'
  }

  function selectRoom() {
    clearTimeout(approach)
    rememberWorkOrigin()
    room = roomFromHash()
    station = 0
    closeup = false
    live = false
    refresh()
    if (rendererSettled) void showScene()
  }

  function onRoomChange() {
    if (dialog.open) dialog.close()
    selectRoom()
    roomTitle.focus()
  }

  function goToRoom(id) {
    history.pushState(history.state, '', '#' + id)
    onRoomChange()
  }

  function enter(id) {
    clearTimeout(approach)
    if (room === 'hall' && live && !reduced.matches) {
      const p = data.portals[id]
      engine.setView({ position: p.focusCamera, target: p.focusTarget, fov: 34 }, true)
      approach = setTimeout(() => goToRoom(id), 440)
    } else {
      goToRoom(id)
    }
  }

  for (const [id, door] of doors) {
    door.onclick = event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
      event.preventDefault()
      enter(id)
    }
  }
  $('#back').onclick = () => goToRoom('hall')
  $('#sculpture').onclick = () => {
    clearTimeout(approach)
    closeup = !closeup
    refresh()
    if (live) engine.setView(view(), true)
  }
  $('#original').onclick = () => {
    const art = data.rooms[room].art
    $('#original-title').textContent = art.title
    $('#original-title').lang = room === 'stage' ? 'en' : 'zh-Hant'
    $('#original-date').textContent = art.date + '　數位繪畫'
    dialog.querySelector('img').src = art.src
    dialog.querySelector('img').alt = art.title
    dialog.showModal()
  }
  $('#close').onclick = () => dialog.close()
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return
    const bounds = dialog.getBoundingClientRect()
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close()
  })
  for (const button of document.querySelectorAll('[data-move]')) {
    button.onclick = () => { if (live) engine.move(button.dataset.move) }
  }
  canvas.onkeydown = event => {
    if (keys[event.key] && live) {
      event.preventDefault()
      engine.move(keys[event.key])
    }
  }
  canvas.addEventListener('exhibit-lost', () => {
    ++revision
    live = false
    refresh()
    shell.dataset.ready = 'true'
  })
  canvas.addEventListener('exhibit-restored', showScene)
  mobile.addEventListener('change', () => { if (live) engine.setView(view()) })
  window.addEventListener('hashchange', onRoomChange)

  updateReturnLink()
  selectRoom()
  const embedded = $('#exhibit-data')
  try {
    data = embedded ? JSON.parse(embedded.textContent) : await fetch('./exhibition.json').then(response => {
      if (!response.ok) throw new Error('展覽資料未能載入')
      return response.json()
    })
  } catch {
    shell.dataset.ready = 'true'
    $('#hint').textContent = $('#status').textContent = '展覽資料未能載入，請重新整理。'
    return
  }
  refresh()
  try {
    const { createExhibition } = await import('./renderer.js')
    engine = createExhibition(canvas, data, enter)
  } catch { /* Keep the stills, station controls, and original art available. */ }
  rendererSettled = true
  await showScene()
}

void mount()
