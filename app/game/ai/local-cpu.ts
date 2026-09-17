import { action, COLLISION_SCALE, IDLE, roster, type Fighter, type Input, type State } from '../shared/combat.ts'

const SHOT_RANGE = 520
const REACT = 10
const ATTACK = 16
const FORWARD = 1
const MAX_HITS = 3
const REST_MIN = 36
const SUPER = /WALRUS|UNLEASH|SWAP$|LUMINOSITY|QUILLSPRAY_START/
const STRING = /JAB|CROSS|FINISHER|SWEEP|KICK|QUILLSPRAY|STARBREAKER|DASH_STRIKE/
const SHOT = /PROJECTILE|DASH_STRIKE|STARBREAKER_1/
const STUNNED = /HITSTUN|BLOCKSTUN|GUARDBREAK|KNOCKED/

const bits: Record<string, number> = { FORWARD: 1, BACK: 2, DOWN: 4, UP: 8, ATTACK: 16, SPECIAL: 32 }

function parseMask(token: string) {
    return token.split('|').reduce((value, key) => value | (bits[key.replace('kBUTTON_', '').replace('_BIT', '')] ?? 0), 0)
}

function seq(cancel: { m_eCancelInput?: string; m_eCancelInput2?: string; m_eCancelInput3?: string }) {
    return [cancel.m_eCancelInput, cancel.m_eCancelInput2, cancel.m_eCancelInput3]
        .filter((token): token is string => Boolean(token))
        .map(parseMask)
}

function toInput(mask: number, face: number): Input {
    const forward = !!(mask & 1)
    const back = !!(mask & 2)
    const facingRight = face === 1
    return {
        right: facingRight ? forward : back,
        left: facingRight ? back : forward,
        down: !!(mask & 4),
        up: !!(mask & 8),
        attack: !!(mask & 16),
        special: !!(mask & 32),
    }
}

function spacing(me: Fighter, foe: Fighter) {
    return (roster[me.hero].m_flHeroWidth + roster[foe.hero].m_flHeroWidth) * COLLISION_SCALE / 2
}

function hitDamage(hero: string, id: string) {
    const found = roster[hero]?.m_vecActionDefinitions?.find((entry: { m_nActionID: string }) => entry.m_nActionID === id)
    return found?.m_flHitDamage ?? 0
}

function ranges(me: Fighter, foe: Fighter) {
    const body = spacing(me, foe)
    return { close: body * 0.9, melee: body + 160, chase: body + 400 }
}

function readyCancels(fighter: Fighter) {
    return ((action(fighter).m_vecCancelOptions ?? []) as any[]).filter((cancel: any) => {
        if (cancel.m_bRequiresInstall && !fighter.install) return false
        if (fighter.used.includes(cancel.m_nCancelActionID)) return false
        if (fighter.age < (cancel.m_nCancelStart ?? 0)) return false
        if (fighter.action !== IDLE && !fighter.connected && !cancel.m_bAllowCancelOnWhiff) return false
        return seq(cancel).length > 0
    })
}

function simplest(cancels: any[], id: string) {
    return cancels
        .filter(cancel => cancel.m_nCancelActionID === id)
        .sort((a, b) => seq(a).length - seq(b).length)[0] ?? null
}

function pickString(cancels: any[]) {
    const hits = cancels.filter(cancel => STRING.test(cancel.m_nCancelActionID) && !SUPER.test(cancel.m_nCancelActionID) && !/PROJECTILE/.test(cancel.m_nCancelActionID))
    const tap = hits.filter(cancel => seq(cancel).length === 1 && (seq(cancel)[0] === ATTACK || seq(cancel)[0] === (ATTACK | FORWARD)))
    return tap.at(-1) ?? hits.at(-1) ?? null
}

function pickOpener(fighter: Fighter, gap: number, melee: number, random: () => number) {
    const cancels = readyCancels(fighter)
    const ids = [...new Set(cancels.map(cancel => String(cancel.m_nCancelActionID)))]
    const superId = ids.find(id => SUPER.test(id))
    const shotId = ids.find(id => SHOT.test(id) && hitDamage(fighter.hero, id) > 0)
    const jabId = ids.find(id => id.includes('JAB'))
    const heavyId = ids.find(id => /CROSS|SWEEP|KICK_1/.test(id))
    if (gap > melee && shotId) return simplest(cancels, shotId)
    if (superId && !fighter.install && /UNLEASH/.test(superId) && random() < 0.28) return simplest(cancels, superId)
    if (superId && random() < 0.1) return simplest(cancels, superId)
    if (heavyId && random() < 0.28) return simplest(cancels, heavyId)
    if (jabId) return simplest(cancels, jabId)
    return cancels.at(-1) ?? null
}

function pickFollow(fighter: Fighter, gap: number, melee: number, random: () => number) {
    if (fighter.combo >= MAX_HITS) return null
    const cancels = readyCancels(fighter)
    if (!cancels.length) return null
    const chain = pickString(cancels)
    const superCancel = cancels.filter((cancel: any) => SUPER.test(cancel.m_nCancelActionID)).sort((a: any, b: any) => seq(a).length - seq(b).length)[0]
    const shot = cancels.filter((cancel: any) => /PROJECTILE/.test(cancel.m_nCancelActionID) && hitDamage(fighter.hero, cancel.m_nCancelActionID) > 0).sort((a: any, b: any) => seq(a).length - seq(b).length)[0]
    if (fighter.connected && chain && random() > 0.32) return chain
    if (fighter.connected && superCancel && random() < 0.22) return superCancel
    if (gap > melee && shot) return shot
    return null
}

export function createLocalCpu(slot = 1, random = Math.random) {
    let tick = 0
    let threatAt = -999
    let restUntil = 0
    let lastAction = IDLE
    let pulses: { mask: number; left: number }[] = []

    const empty: Input = {}

    function enqueue(masks: number[]) {
        for (const mask of masks) {
            pulses.push({ mask: 0, left: 1 })
            pulses.push({ mask, left: 2 })
        }
    }

    function pulse(): number | null {
        while (pulses[0] && pulses[0].left <= 0) pulses.shift()
        if (!pulses[0]) return null
        pulses[0].left--
        return pulses[0].mask
    }

    function reset() {
        tick = 0
        threatAt = -999
        restUntil = 0
        lastAction = IDLE
        pulses = []
    }

    function read(state: State, mode: 'play' | 'move' = 'play'): Input {
        tick++
        const me = state.fighters[slot]
        const foe = state.fighters[1 - slot]
        if (!me || !foe || state.winner !== null || state.pause > 0) {
            pulses = []
            lastAction = IDLE
            return empty
        }

        const gap = Math.abs(foe.x - me.x)
        const { close, melee, chase } = ranges(me, foe)
        const towardRight = foe.x > me.x
        const walk: Input = towardRight ? { right: true } : { left: true }
        const retreat: Input = towardRight ? { left: true } : { right: true }
        const guard: Input = { left: true, right: true, down: true }
        const a = action(foe)
        const attacking = foe.action !== IDLE && !foe.stun && (!!a.m_HitBox || !!a.m_flProjectileSpeed) && foe.age < (a.m_nDuration ?? 30)
        const shot = state.projectiles.some(p =>
            p.owner !== slot
            && Math.abs(p.x - me.x) < SHOT_RANGE
            && (p.face > 0 ? p.x < me.x : p.x > me.x),
        )

        if (me.action === IDLE && lastAction !== IDLE) {
            restUntil = tick + REST_MIN + Math.floor(random() * 22)
            pulses = []
        }
        lastAction = me.action

        if (me.action === IDLE && (attacking || shot)) {
            pulses = []
            if (threatAt < 0) threatAt = tick
            if (tick - threatAt >= REACT) return guard
            return gap > chase ? walk : empty
        }
        threatAt = -999

        if (me.stun > 0 || me.stop > 0) return empty

        const queued = pulse()
        if (queued !== null) return queued ? toInput(queued, me.face) : empty

        if (mode === 'move') return gap > close ? walk : empty
        if (me.action === IDLE && (tick < restUntil || foe.stun > 0 || STUNNED.test(foe.action))) {
            if (gap > melee) return walk
            if (gap < close && random() < 0.12) return retreat
            return empty
        }

        if (me.action !== IDLE) {
            const follow = pickFollow(me, gap, melee, random)
            if (follow) {
                enqueue(seq(follow))
                return toInput(pulse() ?? 0, me.face)
            }
            return empty
        }

        if (gap > chase) return walk
        if (gap < close && random() < 0.16) return retreat

        const opener = pickOpener(me, gap, melee, random)
        if (opener) {
            enqueue(seq(opener))
            return toInput(pulse() ?? 0, me.face)
        }
        return walk
    }

    return { read, reset }
}
