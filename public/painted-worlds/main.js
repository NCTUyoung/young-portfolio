const $ = selector => document.querySelector(selector)
const canvas = $('canvas')
const shell = $('#scene')
const still = $('.still')
const dialog = $('dialog')
const mobile = matchMedia('(max-width: 650px)')
const reduced = matchMedia('(prefers-reduced-motion: reduce)')
try {
  const scheme = localStorage.getItem('vueuse-color-scheme')
  const dark = scheme === 'dark' || (scheme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
} catch { /* File previews can run with storage disabled. */ }

async function mount() {
  const embedded = $('#exhibit-data')
  const data = embedded ? JSON.parse(embedded.textContent) : await fetch('./exhibition.json').then(response => {
    if (!response.ok) throw new Error('展覽資料未能載入')
    return response.json()
  })
  let engine
  let room = 'hall'
  let station = 0
  let closeup = false
  let live = false
  let revision = 0
  let approach
  const stops = $('.stations')
  const keys = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'near', ArrowDown: 'far', '+': 'near', '-': 'far' }
  const fromHash = () => ['orchard','stage'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'hall'
  function view() {
    if (room === 'hall') return closeup ? data.figureView : data.hallView[mobile.matches ? 'mobile' : 'desktop']
    const v = data.rooms[room].views[station]
    return { ...v, fov: mobile.matches ? (v.mobileFov ?? Math.min((v.fov ?? 53) + 5, 73)) : v.fov }
  }
  function refresh() {
    const hall = room === 'hall'
    const r = data.rooms[room]
    const shot = hall ? Number(closeup) : station
    const description = hall
      ? (closeup ? '中央雕像《唯一真神》' : '中央雕像與牆上的兩幅電繪')
      : (r.views[station].description ?? r.title + '，' + r.views[station].label)
    $('#room-title').textContent = r.title
    $('#catalog').textContent = hall ? '近期電繪　／　2026' : r.art.title + '　／　' + r.art.date
    document.title = r.title + '｜Young Portfolio'
    document.body.dataset.world = room
    document.body.dataset.mode = live ? 'webgl' : 'stills'
    document.body.dataset.stop = String(station)
    $('#sculpture').hidden = !hall
    $('#sculpture').textContent = closeup ? '退回展廊' : '近看雕像'
    $('#original').hidden = $('#back').hidden = hall
    $('.doors').hidden = !hall
    stops.hidden = hall
    $('.view-tools').hidden = !live
    if (stops.dataset.room !== room) {
      stops.dataset.room = room
      stops.replaceChildren()
      for (const [i, point] of (r.views ?? []).entries()) {
        const b = document.createElement('button')
        b.textContent = point.label
        b.onclick = () => { station = i; refresh(); if (live) engine.setView(view(),true); $('#status').textContent = point.label }
        stops.append(b)
      }
    }
    Array.from(stops.children).forEach((b,i) => b.setAttribute('aria-pressed',String(i === station)))
    if (!live) {
      const mobileSrc = r.mobileStills?.[shot] ?? r.stills[shot]
      const source = still.querySelector('source')
      if (source.getAttribute('srcset') !== mobileSrc) source.setAttribute('srcset',mobileSrc)
      const image = still.querySelector('img')
      if (image.getAttribute('src') !== r.stills[shot]) image.src = r.stills[shot]
      image.alt = description
    }
    still.hidden = live
    canvas.tabIndex = live ? 0 : -1
    if (live) canvas.setAttribute('aria-label', description.replace(/。$/, '') + '。可用方向鍵調整角度與遠近。')
    canvas.setAttribute('aria-hidden',String(!live))
    $('#hint').textContent = live ? (hall ? '點畫入場 · 拖曳環看' : '拖曳環看 · 雙指縮放') : (hall ? '可從下方選擇作品' : '可切換下方站點取景')
  }
  async function show(id) {
    clearTimeout(approach)
    const run = ++revision
    room = id
    station = 0
    closeup = false
    live = false
    shell.dataset.ready = 'false'
    refresh()
    if (engine) {
      try {
        const shown = await engine.show(room,view())
        if (run !== revision) return
        live = shown
        if (live) engine.setView(view())
      } catch { if (run !== revision) return }
    }
    refresh()
    shell.dataset.ready = 'true'
    $('#status').textContent = data.rooms[room].title
  }
  function enter(id) {
    clearTimeout(approach)
    if (room === 'hall' && live && !reduced.matches) {
      const p = data.portals[id]
      engine.setView({ position: p.focusCamera, target: p.focusTarget, fov: 34 },true)
      approach = setTimeout(() => { location.hash = id },440)
    } else location.hash = id
  }
  for (const a of document.querySelectorAll('[data-door]')) {
    a.onclick = event => { if (event.ctrlKey || event.metaKey || event.shiftKey) return; event.preventDefault(); enter(a.dataset.door) }
  }
  $('#back').onclick = () => { location.hash = 'hall' }
  $('#sculpture').onclick = () => { closeup = !closeup; refresh(); if (live) engine.setView(view(),true) }
  $('#original').onclick = () => {
    const art = data.rooms[room].art
    $('#original-title').textContent = art.title
    $('#original-date').textContent = art.date + '　數位繪畫'
    dialog.querySelector('img').src = art.src
    dialog.querySelector('img').alt = art.title
    dialog.showModal()
  }
  $('#close').onclick = () => dialog.close()
  dialog.addEventListener('click', e => { if (e.target === dialog) {
    const r = dialog.getBoundingClientRect()
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close()
  } })
  for (const b of document.querySelectorAll('[data-move]')) b.onclick = () => { if (live) engine.move(b.dataset.move) }
  canvas.onkeydown = e => { if (keys[e.key] && live) { e.preventDefault(); engine.move(keys[e.key]) } }
  canvas.addEventListener('exhibit-lost', () => { ++revision; live = false; refresh(); shell.dataset.ready = 'true' })
  canvas.addEventListener('exhibit-restored', () => show(room))
  mobile.addEventListener('change', () => { if (live) engine.setView(view()) })
  window.addEventListener('hashchange', () => { if (dialog.open) dialog.close(); show(fromHash()) })
  room = fromHash()
  refresh()
  try {
    const { createExhibition } = await import('./renderer.js')
    engine = createExhibition(canvas,data,enter)
  } catch { /* Stills, original artwork and the exhibition route work without WebGL. */ }
  await show(fromHash())
}
mount().catch(() => { $('#hint').textContent = '展覽資料未能載入，請重新整理。' })
