import type { acquireFighter } from './fighters'

type FighterModel = Awaited<ReturnType<typeof acquireFighter>>

export type MatchIntro = {
  update: (time: number) => boolean
  dispose: () => void
}

const SHOT_MS = 3800
const RING_Z = 4.15

/** Same facing as the character-select presentation. */
const PRESENT_YAW: Record<string, number> = {
  tusk: Math.PI / 2,
  bristleback: Math.PI / 2,
  vengeful: Math.PI / 2,
  dawnbreaker: -Math.PI / 2 + 0.35,
  marci: Math.PI / 2 + 0.45,
}

function ringYaw(hero: string) {
  return PRESENT_YAW[hero] ?? Math.PI / 2
}

function playVictory(model: FighterModel, time: number) {
  const yaw = ringYaw(model.hero)
  const start = model.clips.includes('fighting_victory_start') ? 'fighting_victory_start' : ''
  const loop = model.clips.includes('fighting_victory') ? 'fighting_victory' : ''
  const startDur = start ? model.clipDuration(start) : 0
  if (start && time < Math.max(0.05, startDur)) {
    model.pose(start, time, yaw, 0, RING_Z)
    return
  }
  if (loop) {
    const duration = Math.max(0.001, model.clipDuration(loop))
    model.pose(loop, Math.max(0, time - startDur) % duration, yaw, 0, RING_Z)
    return
  }
  if (start) {
    model.pose(start, Math.min(time, Math.max(0, startDur - 0.001)), yaw, 0, RING_Z)
    return
  }
  model.pose('fighting_idle', time, yaw, 0, RING_Z)
}

/**
 * Match open on the real arena with its locked fight camera. One fighter at a
 * time stands center-stage and plays their victory animation, then we cut to
 * the actual fight. The diorama camera never moves, so scenery stays put.
 */
export function createMatchIntro(opts: {
  models: FighterModel[]
  names: string[]
  heroes: string[]
  onShot?: (index: number, name: string, hero: string) => void
}): MatchIntro {
  let shown = -1
  let started = -1

  function show(index: number) {
    if (shown === index) return
    shown = index
    opts.models.forEach((model, i) => {
      const active = i === index
      model.root.visible = active
      if (active) {
        model.resetMotion()
        return
      }
      model.root.position.set(0, -40, RING_Z)
    })
    opts.onShot?.(index, opts.names[index] ?? '', opts.heroes[index] ?? '')
  }

  return {
    update(time) {
      if (started < 0) started = time
      const age = Math.max(0, time - started)
      if (age >= SHOT_MS * 2) return false
      const index = age < SHOT_MS ? 0 : 1
      show(index)
      const model = opts.models[index]
      if (model) playVictory(model, (age % SHOT_MS) / 1000)
      return true
    },
    dispose() {
      for (const model of opts.models) {
        model.root.visible = true
        model.resetMotion()
      }
    },
  }
}
