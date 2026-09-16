import * as T from 'three'
import { acquireFighter, loadFighter, releaseFighter } from '../game/render/fighters'

type Model = Awaited<ReturnType<typeof loadFighter>>
type Slot = { x: number; y: number; w: number; h: number }
const heroes = ['tusk', 'bristleback', 'vengeful', 'dawnbreaker', 'marci']

export function createHeroPreview(
  root: HTMLElement,
  canvas: HTMLCanvasElement,
  heroSlot: HTMLElement,
  selected: () => string,
  loaded: () => void,
  onReady?: (id: string) => void,
) {
  let cards: HTMLElement[] = []
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', stencil: false })
  renderer.setPixelRatio(Math.min(1, devicePixelRatio))
  renderer.outputColorSpace = T.SRGBColorSpace
  renderer.toneMapping = T.ACESFilmicToneMapping
  renderer.autoClear = false
  const scene = new T.Scene()
  scene.add(new T.HemisphereLight(0xd7e7ff, 0x3a2a22, 2.4))
  const key = new T.DirectionalLight(0xfff1dc, 3.4)
  key.position.set(1.6, 5.5, 7)
  scene.add(key)
  const rim = new T.DirectionalLight(0x9ec0ff, 1.6)
  rim.position.set(-5, 3, -3)
  scene.add(rim)
  const camera = new T.PerspectiveCamera(30, .7, .05, 80)
  const models = new Map<string, Model>()
  const rigs = new Map<string, { weapons: T.Object3D[]; head?: T.Bone }>()
  const look = new T.Vector3()
  const face = new T.Vector3()
  const dir = new T.Vector3()
  const headPos = new T.Vector3()
  const headQuat = new T.Quaternion()
  const axes = [new T.Vector3(1, 0, 0), new T.Vector3(-1, 0, 0), new T.Vector3(0, 0, 1), new T.Vector3(0, 0, -1)]
  const yaw: Record<string, number> = { tusk: Math.PI / 2, bristleback: Math.PI / 2, dawnbreaker: 0, marci: Math.PI / 2 + .45, vengeful: Math.PI / 2 }
  const cardCam: Record<string, { back: number; lift: number; aim: number }> = {
    tusk: { back: 3.95, lift: .18, aim: .18 },
    bristleback: { back: 4.15, lift: .12, aim: .14 },
    vengeful: { back: 2.15, lift: .12, aim: .16 },
    dawnbreaker: { back: 2.15, lift: .12, aim: .16 },
    marci: { back: 2.15, lift: .12, aim: .16 },
  }
  const posed = new Set<string>()
  let heroRect: Slot = { x: 0, y: 0, w: 0, h: 0 }
  let cardRects: Slot[] = []
  let disposed = false
  let raf = 0
  let clock = 0
  let last = performance.now()
  let width = 0
  let height = 0
  let visible = !document.hidden

  function slotOf(element: HTMLElement, view: DOMRect): Slot {
    const rect = element.getBoundingClientRect()
    return {
      x: Math.round(rect.left - view.left),
      y: Math.round(view.bottom - rect.bottom),
      w: Math.round(rect.width),
      h: Math.round(rect.height),
    }
  }

  function measure() {
    width = root.clientWidth
    height = root.clientHeight
    renderer.setSize(width, height, false)
    const view = canvas.getBoundingClientRect()
    heroRect = slotOf(heroSlot, view)
    cards = [...root.querySelectorAll<HTMLElement>('[data-hero]')]
    cardRects = cards.map(card => slotOf(card, view))
  }

  function remember(id: string, model: Model) {
    const weapons: T.Object3D[] = []
    let head: T.Bone | undefined
    model.root.traverse(object => {
      if (/weapon|hammer|fish|basket/i.test(object.name)) weapons.push(object)
      if (!head && (object as T.Bone).isBone && /head/i.test(object.name) && !/attach|weapon|helm|hat|horn/i.test(object.name)) head = object as T.Bone
    })
    weapons.forEach(object => { object.visible = false })
    rigs.set(id, { weapons, head })
  }

  function headAt(id: string) {
    const head = rigs.get(id)?.head
    if (head) head.getWorldPosition(headPos)
    else headPos.set(0, 2.8, 0)
    return headPos
  }

  function faceForward(id: string) {
    const head = rigs.get(id)?.head
    if (head) head.getWorldQuaternion(headQuat)
    else headQuat.identity()
    let best = -Infinity
    face.set(1, 0, 0)
    for (const axis of axes) {
      dir.copy(axis).applyQuaternion(headQuat)
      if (dir.x > best) {
        best = dir.x
        face.copy(dir)
      }
    }
    return face.normalize()
  }

  function frame(id: string, aspect: number, close: boolean) {
    const pos = headAt(id)
    camera.aspect = Math.max(.2, aspect)
    camera.up.set(0, 1, 0)
    if (close) {
      const shot = cardCam[id] ?? cardCam.marci
      look.copy(pos)
      look.y += shot.aim
      camera.fov = 20
      camera.position.set(look.x + shot.back, look.y + shot.lift, look.z + shot.back)
    } else {
      look.copy(pos)
      look.x += .55
      look.y -= id === 'bristleback' ? .16 : .42
      camera.fov = 26
      if (id === 'bristleback') camera.position.copy(look).addScaledVector(faceForward(id), 4.45).setY(look.y + .3)
      else camera.position.set(look.x + 2.95, look.y + .18, look.z + 2.95)
    }
    camera.lookAt(look)
    camera.updateProjectionMatrix()
  }

  function pass(slot: Slot, id: string, close: boolean, clear: string) {
    const model = models.get(id)
    if (!model || slot.w < 2 || slot.h < 2) return
    if (!posed.has(id)) {
      model.preview(clock, yaw[id] ?? Math.PI / 2)
      posed.add(id)
    }
    models.forEach((item, key) => { item.root.visible = key === id })
    for (const object of rigs.get(id)?.weapons ?? []) object.visible = !close
    renderer.setViewport(slot.x, slot.y, slot.w, slot.h)
    renderer.setScissor(slot.x, slot.y, slot.w, slot.h)
    renderer.setClearColor(clear, 0)
    renderer.clear(true, true)
    frame(id, slot.w / slot.h, close)
    renderer.render(scene, camera)
  }

  function draw(now = performance.now()) {
    if (disposed) return
    raf = requestAnimationFrame(draw)
    if (!visible) return
    if (root.clientWidth !== width || root.clientHeight !== height) measure()
    clock += Math.min(.05, Math.max(0, (now - last) / 1000)) * .9
    last = now
    const active = selected()
    posed.clear()
    renderer.setScissorTest(false)
    renderer.setViewport(0, 0, width, height)
    renderer.setClearColor(0x000000, 0)
    renderer.clear(true, true)
    renderer.setScissorTest(true)
    pass(heroRect, active, false, '#000000')
    heroes.forEach((hero, index) => pass(cardRects[index], hero, true, '#000000'))
  }

  function onVisibility() {
    visible = !document.hidden
    last = performance.now()
  }

  measure()
  window.addEventListener('resize', measure)
  document.addEventListener('visibilitychange', onVisibility)
  const roster = root.querySelector('.hero-list')
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(() => measure()) : null
  if (roster) observer?.observe(roster)
  observer?.observe(root)
  const later = window.setTimeout(measure, 480)
  void (async () => {
    for (const id of heroes) {
      let model: Model | null = null
      try {
        model = await acquireFighter(id)
      } catch (error) {
        console.warn(`Preview indisponível: ${id}`, error)
      }
      if (!model) continue
      if (disposed) {
        releaseFighter(model)
        return
      }
      remember(id, model)
      models.set(id, model)
      scene.add(model.root)
      model.root.visible = false
      measure()
      onReady?.(id)
      if (!raf) draw()
    }
    loaded()
  })()

  return () => {
    disposed = true
    cancelAnimationFrame(raf)
    window.removeEventListener('resize', measure)
    document.removeEventListener('visibilitychange', onVisibility)
    observer?.disconnect()
    window.clearTimeout(later)
    models.forEach(releaseFighter)
    renderer.dispose()
  }
}
