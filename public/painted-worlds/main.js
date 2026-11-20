const $ = selector => document.querySelector(selector)
const canvas = $('canvas')
const shell = $('#scene')
const still = $('.still')
const dialog = $('dialog')
const roomTitle = $('#room-title')
const index = $('.room-index')
const doors = $('.doors')
const years = $('.years')
const mobile = matchMedia('(max-width: 650px)')
const reduced = matchMedia('(prefers-reduced-motion: reduce)')
const isEmbedded = document.documentElement.dataset.embed === '1'
const source = new URLSearchParams(location.search).get('from')

function setStill(src, mobileSrc, description) {
  const source = still.querySelector('source')
  const image = still.querySelector('img')
  if (source.getAttribute('srcset') !== mobileSrc) source.setAttribute('srcset', mobileSrc)
  if (image.getAttribute('src') !== src) image.src = src
  image.alt = description
}

async function readJSON(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error('展覽資料未能載入')
  return response.json()
}

async function mount() {
  let data
  let registry
  try {
    const inline = $('#exhibit-data')
    ;[data, registry] = await Promise.all([
      inline ? JSON.parse(inline.textContent) : readJSON('./exhibition.json'),
      readJSON('./work-registry.json')
    ])
  } catch {
    shell.dataset.ready = 'true'
    $('#hint').textContent = $('#status').textContent = '展覽資料未能載入，請重新整理。'
    return
  }
  const works = new Map(registry.map(work => [work.id, work]))
  const yearOptions = [...new Set(registry.map(work => work.year))].sort((a, b) => a - b)
  const stops = $('.stations')
  const keys = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'near', ArrowDown: 'far', '+': 'near', '-': 'far' }

  function roomFromHash() {
    const id = location.hash.slice(1)
    return works.has(id) ? id : 'hall'
  }

  const savedWork = works.get(history.state?.paintedWorldsWork)
  const origin = source === 'work' ? (savedWork ?? works.get(roomFromHash())) : undefined
  if (!isEmbedded) {
    const link = $('#source-return')
    if (source === 'home') {
      link.href = '../'
      link.textContent = '回到首頁'
    } else if (source === 'light') {
      link.href = '../exhibition/light/#painting'
      link.textContent = '回到繪作站'
    } else if (origin) {
      const gallery = new URL($('#gallery-link').href)
      gallery.searchParams.set('image', origin.workId)
      link.href = gallery.href
      link.textContent = '回到《' + origin.art.title + '》'
      if (!savedWork) history.replaceState({ ...history.state, paintedWorldsWork: origin.id }, '')
    }
    if (link.textContent) {
      link.hidden = false
      $('#gallery-link').hidden = true
    }
  }

  let room = roomFromHash()
  let year = works.get(room)?.year ?? yearOptions.at(-1)
  let station = 0
  let closeup = false
  let live = false
  let loading = false
  let engine
  let enginePromise
  let revision = 0
  let approach

  function view() {
    if (room === 'hall') return closeup ? data.figureView : data.hallView[mobile.matches ? 'mobile' : 'desktop']
    const v = data.rooms[room].views[station]
    return { ...v, fov: mobile.matches ? v.mobileFov : v.fov }
  }

  function renderDoors() {
    for (const button of years.children) button.setAttribute('aria-pressed', String(Number(button.dataset.year) === year))
    const selection = registry.filter(work => work.year === year)
    doors.replaceChildren(...selection.map(work => {
      const link = document.createElement('a')
      link.href = '#' + work.id
      link.dataset.door = work.id
      const image = document.createElement('img')
      image.width = 54
      image.height = 70
      image.decoding = 'async'
      image.loading = 'lazy'
      image.alt = ''
      image.src = work.art.thumb
      const title = document.createElement('strong')
      title.textContent = work.art.title
      link.append(image, title)
      link.onclick = event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
        event.preventDefault()
        goToRoom(work.id)
      }
      return link
    }))
    $('#status').textContent = year + ' 年，' + selection.length + ' 幅作品'
  }

  for (const option of yearOptions) {
    const button = document.createElement('button')
    button.type = 'button'
    button.dataset.year = String(option)
    button.textContent = String(option)
    button.onclick = () => {
      if (year === option) return
      clearTimeout(approach)
      year = option
      renderDoors()
    }
    years.append(button)
  }

  function selectStation(position) {
    station = position
    refresh()
    if (live) engine.setView(view(), true)
    $('#status').textContent = data.rooms[room].views[station].label
  }

  function refresh() {
    const hall = room === 'hall'
    const settings = data.rooms[room]
    const work = works.get(room)
    const shot = hall ? Number(closeup) : station
    const point = settings?.views?.[station]
    const description = point?.description ?? (hall
      ? (closeup ? '中央雕像《唯一真神》' : '中央雕像與牆上的兩幅電繪')
      : work.art.title)
    const title = work?.title ?? settings.title
    if (roomTitle.textContent !== title) {
      roomTitle.textContent = title
      document.title = title + '｜Young Portfolio'
    }
    document.body.dataset.world = room
    document.body.dataset.mode = live ? 'webgl' : 'stills'
    document.body.dataset.stop = String(station)
    $('#sculpture').hidden = !hall
    $('#sculpture').textContent = closeup ? '展廊全景' : '近看雕像'
    $('.room-route').hidden = hall
    index.hidden = !hall
    // Only attach the current year's thumbnail URLs when the corridor is shown.
    if (hall && !doors.childElementCount) renderDoors()
    $('.work-plaque').hidden = hall
    if (work) {
      const artTitle = $('#work-title')
      artTitle.textContent = work.art.title
      artTitle.hidden = work.art.title === title
      $('#catalog').textContent = '數位繪畫　／　' + work.art.date
    }

    stops.hidden = !point
    if (stops.dataset.room !== room) {
      stops.dataset.room = room
      stops.replaceChildren(...(settings?.views ?? []).map((stop, position) => {
        const button = document.createElement('button')
        button.type = 'button'
        button.textContent = stop.label
        button.setAttribute('aria-label', stop.label)
        const cue = document.createElement('span')
        cue.id = 'station-cue-' + position
        cue.className = 'station-cue'
        button.setAttribute('aria-describedby', cue.id)
        button.append(cue)
        button.onclick = () => selectStation(position)
        return button
      }))
    }
    Array.from(stops.children).forEach((button, position) => {
      button.setAttribute('aria-pressed', String(position === station))
      button.querySelector('.station-cue').textContent = position === station ? '目前站點' : position === station + 1 ? '下一站' : ''
    })

    if (!live) {
      const src = settings?.stills[shot] ?? work.art.thumb
      setStill(src, settings?.mobileStills?.[shot] ?? src, description)
    }
    still.hidden = live
    shell.dataset.ready = String(!loading)
    shell.dataset.preview = String(!settings)
    canvas.tabIndex = live ? 0 : -1
    if (live) canvas.setAttribute('aria-label', description.replace(/。$/, '') + '。可用方向鍵調整角度與遠近。')
    canvas.setAttribute('aria-hidden', String(!live))
    $('.view-tools').hidden = !live
    $('#view-caption').hidden = !point
    $('#view-caption').textContent = point ? description : ''
    $('#hint').textContent = !settings ? '展間準備中，原作已可觀看。'
      : live ? (hall ? (mobile.matches ? '拖曳環看' : '點選牆上的畫，或拖曳環看。') : '拖曳環看，可用雙指縮放。')
      : loading ? '立體場景載入中。' : (hall ? '從上方選擇一幅作品。' : '目前顯示展間定格。')
  }

  async function showScene() {
    const run = ++revision
    loading = Object.hasOwn(data.models, room)
    refresh()
    if (!loading) return
    enginePromise ??= import('./renderer.js')
      .then(({ createExhibition }) => createExhibition(canvas, data, enterPortal))
      .catch(() => undefined)
    engine = await enginePromise
    if (run !== revision) return
    if (engine) {
      try {
        const shown = await engine.show(room, view())
        if (run !== revision) return
        live = shown
        // The visitor may choose another station while the room is loading.
        if (shown) engine.setView(view())
      } catch {
        if (run !== revision) return
        engine.clear()
      }
    }
    loading = false
    refresh()
  }

  function onRoomChange(id) {
    if (id === room) return
    clearTimeout(approach)
    if (dialog.open) dialog.close()
    engine?.clear()
    room = id
    station = 0
    closeup = live = false
    void showScene()
    roomTitle.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }

  function goToRoom(id) {
    if (id === room) return
    if (!isEmbedded) history.pushState(history.state, '', '#' + id)
    onRoomChange(id)
  }

  function enterPortal(id) {
    clearTimeout(approach)
    const portal = data.portals[id]
    if (room === 'hall' && live && portal && !reduced.matches) {
      engine.setView({ position: portal.focusCamera, target: portal.focusTarget, fov: 34 }, true)
      approach = setTimeout(() => goToRoom(id), 440)
    } else {
      goToRoom(id)
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
    const { art } = works.get(room)
    $('#original-title').textContent = art.title
    $('#original-date').textContent = art.date + '　數位繪畫'
    const image = dialog.querySelector('img')
    image.src = art.src
    image.alt = art.title
    dialog.showModal()
  }
  $('#close').onclick = () => dialog.close()
  dialog.addEventListener('close', () => {
    if (!dialog.open) dialog.querySelector('img').removeAttribute('src')
  })
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
    clearTimeout(approach)
    live = loading = false
    refresh()
  })
  canvas.addEventListener('exhibit-restored', showScene)
  mobile.addEventListener('change', () => {
    if (live) engine.setView(view())
    refresh()
  })
  window.addEventListener('hashchange', () => onRoomChange(roomFromHash()))

  await showScene()
}

if (isEmbedded) {
  window.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing) return
    event.preventDefault()
    if (event.repeat) return
    if (dialog.open) dialog.close()
    else window.parent.postMessage({ type: 'painted-world:close' }, location.origin)
  })
}

void mount()
