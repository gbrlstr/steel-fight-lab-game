import type { acquireFighter } from './fighters'

type FighterModel = Awaited<ReturnType<typeof acquireFighter>>

export type IntroCue = {
  kind: 'walk' | 'arrive' | 'versus'
  index: number
  name: string
  hero: string
}

export type MatchIntro = {
  update: (time: number) => boolean
  dispose: () => void
}

export const INTRO_HOME = [-5.1, 5.1] as const
const HOME = INTRO_HOME
const ENTRY = [-8.05, 8.05] as const
const FACE = [1, -1] as const

const LEFT_WALK = 2800
const LEFT_POSE = 4200
const VERSUS = 2400
const RIGHT_WALK = 2800
const RIGHT_POSE = 4200

const T_LEFT_ARRIVE = LEFT_WALK
const T_VERSUS = LEFT_WALK + LEFT_POSE
const T_RIGHT_START = T_VERSUS + VERSUS
const T_RIGHT_ARRIVE = T_RIGHT_START + RIGHT_WALK
const T_END = T_RIGHT_ARRIVE + RIGHT_POSE

function easeOut(t: number) {
  const u = Math.min(1, Math.max(0, t))
  return 1 - (1 - u) ** 3
}

function walkX(index: 0 | 1, t: number) {
  return ENTRY[index] + (HOME[index] - ENTRY[index]) * easeOut(t)
}

function playVictory(model: FighterModel, time: number, x: number, face: number) {
  const start = model.clips.includes('fighting_victory_start') ? 'fighting_victory_start' : ''
  const loop = model.clips.includes('fighting_victory') ? 'fighting_victory' : ''
  const startDur = start ? model.clipDuration(start) : 0
  if (start && time < Math.max(0.05, startDur)) {
    model.stage(start, time, x, face, false, true)
    return
  }
  if (loop) {
    const duration = Math.max(0.001, model.clipDuration(loop))
    model.stage(loop, Math.max(0, time - startDur) % duration, x, face, true, true)
    return
  }
  if (start) {
    model.stage(start, Math.min(time, Math.max(0, startDur - 0.001)), x, face, false, true)
    return
  }
  model.stage('fighting_idle', time, x, face, true, true)
}

function playWalk(model: FighterModel, time: number, x: number, face: number) {
  const clip = model.clips.includes('fighting_advancing') ? 'fighting_advancing' : 'fighting_idle'
  model.stage(clip, time, x, face, true)
}

/**
 * Left fighter walks to their corner, poses and is named; VERSUS; then the
 * right fighter does the same. Fight camera stays locked on the arena.
 */
export function createMatchIntro(opts: {
  models: FighterModel[]
  names: string[]
  heroes: string[]
  onCue?: (cue: IntroCue) => void
}): MatchIntro {
  let started = -1
  let cue = ''

  opts.models.forEach((model, i) => {
    const side = i === 0 ? 0 : 1
    model.root.visible = false
    model.root.position.set(ENTRY[side], 0, 4.15)
  })

  function fire(kind: IntroCue['kind'], index: number) {
    const key = `${kind}:${index}`
    if (cue === key) return
    cue = key
    opts.onCue?.({
      kind,
      index,
      name: opts.names[index] ?? '',
      hero: opts.heroes[index] ?? '',
    })
  }

  function hide(model: FighterModel | undefined, side: 0 | 1) {
    if (!model) return
    model.root.visible = false
    model.root.position.set(ENTRY[side], 0, 4.15)
  }

  return {
    update(time) {
      if (started < 0) started = time
      const age = Math.max(0, time - started)
      if (age >= T_END) return false

      const left = opts.models[0]
      const right = opts.models[1]

      if (age < T_LEFT_ARRIVE) {
        fire('walk', 0)
        hide(right, 1)
        if (left) playWalk(left, age / 1000, walkX(0, age / LEFT_WALK), FACE[0])
        return true
      }

      if (age < T_VERSUS) {
        fire('arrive', 0)
        hide(right, 1)
        if (left) playVictory(left, (age - T_LEFT_ARRIVE) / 1000, HOME[0], FACE[0])
        return true
      }

      if (age < T_RIGHT_START) {
        fire('versus', 0)
        hide(right, 1)
        if (left) playVictory(left, (age - T_LEFT_ARRIVE) / 1000, HOME[0], FACE[0])
        return true
      }

      if (age < T_RIGHT_ARRIVE) {
        fire('walk', 1)
        if (left) playVictory(left, (age - T_LEFT_ARRIVE) / 1000, HOME[0], FACE[0])
        if (right) playWalk(right, (age - T_RIGHT_START) / 1000, walkX(1, (age - T_RIGHT_START) / RIGHT_WALK), FACE[1])
        return true
      }

      fire('arrive', 1)
      if (left) playVictory(left, (age - T_LEFT_ARRIVE) / 1000, HOME[0], FACE[0])
      if (right) playVictory(right, (age - T_RIGHT_ARRIVE) / 1000, HOME[1], FACE[1])
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
