import * as T from 'three'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { action, FIGHTER_PRESENCE, FIGHTER_TARGET_HEIGHT, WORLD_PER_SIM, isGuardInput } from '../shared/combat'
import type { Fighter } from '../shared/combat'
import { loadGltf } from './asset-cache'
export { FIGHTER_PRESENCE }
const assets: Record<string, [string, string[]]> = { tusk: ['tuskarr', ['tuskarr', 'tusk_armor_glove', 'tusk_cowl', 'tusk_hat', 'tusk_horns', 'tusk_weapon', 'tusk_fish_basket']], bristleback: ['bristleback', ['bristleback', 'bristleback_back', 'bristleback_bracer', 'bristleback_head', 'bristleback_necklace', 'bristleback_weapon']], vengeful: ['shendelzare', ['vengeful_spirit_arcana', 'vengeful_spirit_arcana_head_refit', 'vengeful_spirit_arcana_legs_refit', 'vengeful_spirit_arcana_weapon', 'vengeful_spirit_arcana_shoulders']], marci: ['marci', ['marci_base', 'marci_back', 'marci_costume', 'marci_head', 'marci_shoulders']], dawnbreaker: ['dawnbreaker', ['dawnbreaker', 'dawnbreaker_armor', 'dawnbreaker_arms', 'dawnbreaker_head', 'dawnbreaker_weapon']] }
export const fighterIds = Object.keys(assets)
const names: Record<string, string> = { tusk: 'Tusk', bristleback: 'Bristleback', vengeful: 'Shendelzare', dawnbreaker: 'Dawnbreaker', marci: 'Marci' }
export const fighterJobs = fighterIds.flatMap(id => {
    const [folder, files] = assets[id]
    return files.map(file => ({ url: `/fighters/${folder}/${file}.glb`, label: names[id] }))
})
const dawnYaw = { right: Math.PI / 2 - 200 * Math.PI / 180, left: Math.PI / 2 - 50 * Math.PI / 180 }
type FighterModel = Awaited<ReturnType<typeof loadFighter>>
const pools = new Map<number, Map<string, FighterModel[]>>()
function pile(presence: number, id: string) {
    let group = pools.get(presence)
    if (!group) { group = new Map(); pools.set(presence, group) }
    let items = group.get(id)
    if (!items) { items = []; group.set(id, items) }
    return items
}
export function fighterStocked(id: string, presence = 1) { return (pools.get(presence)?.get(id)?.length ?? 0) > 0 }
const restockQueue: { id: string; presence: number }[] = []
let restocking = false
function pumpRestock() {
    const job = restockQueue.shift()
    if (!job) { restocking = false; return }
    restocking = true
    const later = (done: () => void) => {
        const idle = window.requestIdleCallback
        if (idle) idle(() => done(), { timeout: 1200 })
        else window.setTimeout(done, 480)
    }
    later(() => {
        void loadFighter(job.id, job.presence).then(model => {
            const cap = job.presence === 1 ? 1 : 2
            if (pile(job.presence, job.id).length < cap) pile(job.presence, job.id).push(model)
        }).catch(() => { }).finally(pumpRestock)
    })
}
export function acquireFighter(id: string, presence = 1) {
    const cached = pile(presence, id).pop()
    if (cached) {
        if (presence !== 1) { restockQueue.push({ id, presence }); if (!restocking) pumpRestock() }
        return Promise.resolve(cached)
    }
    return loadFighter(id, presence)
}
export function releaseFighter(model: FighterModel) {
    model.park()
    model.root.removeFromParent()
    const cap = model.presence === 1 ? 1 : 2
    const items = pile(model.presence, model.hero)
    if (items.length < cap) items.push(model)
}
export async function ensureStock(id: string, presence: number, copies: number) {
    const items = pile(presence, id)
    const missing = Math.max(0, copies - items.length)
    if (!missing) return
    const made = await Promise.all(Array.from({ length: missing }, () => loadFighter(id, presence).catch(() => null)))
    items.push(...made.filter((model): model is FighterModel => !!model))
}
export async function stockFighters(presence: number, copies: number) {
    for (const id of fighterIds) {
        const made = await Promise.all(Array.from({ length: copies }, () => loadFighter(id, presence).catch(() => null)))
        pile(presence, id).push(...made.filter((model): model is FighterModel => !!model))
    }
}
export async function loadFighter(id: string, presence = 1) {
    const [folder, files] = assets[id]
    const gltfs = await Promise.all(files.map(file => loadGltf(`/fighters/${folder}/${file}.glb`)))
    const root = new T.Group(), body = cloneSkinned(gltfs[0].scene); root.add(body); root.updateMatrixWorld(true)
    const baseBones = new Map<string, T.Bone>(); body.traverse(o => { if ((o as T.Bone).isBone) baseBones.set(o.name.toLowerCase(), o as T.Bone) })
    const followers: { bone: T.Bone; source: T.Bone; offset: T.Matrix4 }[] = []
    const unmatched: string[] = []
    for (const part of gltfs.slice(1)) {
        const partScene = cloneSkinned(part.scene); root.add(partScene); root.updateMatrixWorld(true)
        partScene.traverse(o => { if (!(o as T.Bone).isBone) return; const source = baseBones.get(o.name.toLowerCase()); if (source) followers.push({ bone: o as T.Bone, source, offset: source.matrixWorld.clone().invert().multiply(o.matrixWorld) }); else unmatched.push(o.name) })
    }
    // Preserve each accessory bind transform. Apply the animated body bone delta in world space,
    // then convert back through the actual accessory parent; hierarchy differences are supported.
    const scratchWorld = new T.Matrix4(), scratchLocal = new T.Matrix4()
    function sync() { root.updateMatrixWorld(true); for (const { bone, source, offset } of followers) { scratchWorld.copy(source.matrixWorld).multiply(offset); scratchLocal.copy(bone.parent!.matrixWorld).invert().multiply(scratchWorld); scratchLocal.decompose(bone.position, bone.quaternion, bone.scale); bone.updateMatrixWorld(true) } }
    const mixer = new T.AnimationMixer(body), clips = new Map(gltfs[0].animations.map(c => [c.name, c])); let current: T.AnimationAction | null = null, last = '', lastPoseFrame = -1, previousX = NaN, walkHold = 0, walkDir = 0, outro = 0, outroAction = '', outroAt = 0
    // Normalize by the posed body mesh — not the full root AABB (weapons / wings / baskets
    // inflate height and made stocky heroes like Tusk look much smaller than Shendelzare).
    const measureClip = clips.get('fighting_idle') ?? [...clips.values()][0]
    if (measureClip) {
        const probe = mixer.clipAction(measureClip)
        probe.play()
        probe.time = 0
        mixer.update(0)
    }
    sync()
    root.updateMatrixWorld(true)
    const bodyBox = new T.Box3().setFromObject(body, true)
    const height = Math.max(0.001, bodyBox.max.y - bodyBox.min.y)
    mixer.stopAllAction()
    // Visual scale is provisional and independent of the simulation coordinate system.
    root.scale.setScalar(FIGHTER_TARGET_HEIGHT / height * presence)
    let floor = -bodyBox.min.y * root.scale.x, grounded = false
    root.traverse(o => { if ((o as T.Mesh).isMesh) { o.frustumCulled = false } })
    function park() { mixer.stopAllAction(); current = null; last = ''; lastPoseFrame = -1; previousX = NaN; walkHold = 0; walkDir = 0; outro = 0; outroAction = ''; grounded = false; root.visible = true; root.traverse(o => { if (/weapon|hammer|fish|basket/i.test(o.name)) o.visible = true }) }
    function resetMotion() {
        lastPoseFrame = -1
        previousX = NaN
        walkHold = 0
        walkDir = 0
        last = ''
        current?.stop()
        current = null
    }
    return {
        root, unmatched, hero: id, presence, park, resetMotion, clips: [...clips.keys()], update(f: Fighter) {
            const a = action(f); let name = a.m_pszSequenceName
            const ending = f.action === 'VICTORY_ACTION_DEFINITION' || f.action === 'DEFEAT_ACTION_DEFINITION'
            const now = performance.now()
            if (ending) { if (outroAction !== f.action) { outro = 0; outroAction = f.action } else outro += Math.min(.05, Math.max(0, (now - outroAt) / 1000)); outroAt = now } else outroAction = ''
            // Recuar (só trás) ≠ bloquear (A+S+D / ←+↓+→).
            // Bloqueio também na borda se estiver parado segurando só trás.
            if (f.age !== lastPoseFrame) {
                const dx = Number.isFinite(previousX) ? f.x - previousX : 0
                const guarding = isGuardInput(f.lastMask)
                if (guarding) {
                    walkHold = 0
                    walkDir = 0
                } else if (Math.abs(dx) > 80) {
                    walkHold = 0
                    walkDir = 0
                } else if (Math.abs(dx) > .5) {
                    walkDir = dx * f.face > 0 ? 1 : -1
                    walkHold = 10
                } else if (walkHold > 0) {
                    walkHold--
                }
                previousX = f.x
                lastPoseFrame = f.age
            }
            if (f.action === 'IDLE_ACTION_DEFINITION') {
                const holdingBack = !!(f.lastMask & 2) && !(f.lastMask & 1)
                const holdingForward = !!(f.lastMask & 1) && !(f.lastMask & 2)
                const guarding = isGuardInput(f.lastMask)
                if (guarding) name = 'fighting_block'
                else if (walkHold > 0) {
                    if (holdingForward) name = 'fighting_advancing'
                    else if (holdingBack) name = 'fighting_retreating'
                    else name = walkDir >= 0 ? 'fighting_advancing' : 'fighting_retreating'
                } else if (holdingBack) {
                    name = 'fighting_retreating'
                } else {
                    name = 'fighting_idle'
                }
                if (!clips.has(name)) name = clips.has('fighting_idle') ? 'fighting_idle' : name
            }
            let time = f.age / 60
            if (ending) {
                const start = a.m_pszSequenceName, loop = f.action === 'VICTORY_ACTION_DEFINITION' ? 'fighting_victory' : 'fighting_defeat'
                const startDur = clips.get(start)?.duration ?? 0
                if (clips.has(start) && outro < startDur) { name = start; time = outro }
                else if (clips.has(loop)) { name = loop; time = (outro - startDur) % Math.max(.001, clips.get(loop)!.duration) }
                else if (clips.has(start)) { name = start; time = Math.max(0, startDur - .001) }
            }
            if (clips.has(name)) {
                if (name !== last) {
                    current?.stop()
                    current = mixer.clipAction(clips.get(name)!)
                    current.setLoop(T.LoopRepeat, Infinity)
                    current.clampWhenFinished = false
                    current.enabled = true
                    current.play()
                    last = name
                }
                const duration = Math.max(.001, clips.get(name)!.duration)
                // Guard / blockstun: ease into the pose, then hold (avoids dead freeze on remote).
                if (name === 'fighting_block' || name === 'fighting_blockstun' || f.action === 'BLOCKSTUN_ACTION_DEFINITION') {
                    const hold = Math.min(duration * .4, Math.max(.08, duration - .05))
                    const intro = Math.min(hold, Math.max(current!.time, 0) + 1 / 60)
                    current!.time = intro
                } else {
                    current!.time = ending ? time : (f.age / 60) % duration
                }
                mixer.update(0)
            }
            root.position.set(f.x * WORLD_PER_SIM, floor, 4.15)
            if (id === 'dawnbreaker') { root.rotation.y = f.face > 0 ? dawnYaw.left : dawnYaw.right; root.scale.z = Math.abs(root.scale.z) }
            else { root.rotation.y = Math.PI / 2; root.scale.z = Math.abs(root.scale.z) * f.face }
            sync(); if (!grounded) { const posed = new T.Box3().setFromObject(body, true); floor -= posed.min.y; root.position.y = floor; grounded = true; sync() }
        }, preview(time: number, turn = 0) {
            const name = clips.has('fighting_idle') ? 'fighting_idle' : [...clips.keys()][0]
            if (name && clips.has(name)) { if (name !== last) { current?.stop(); current = mixer.clipAction(clips.get(name)!); current.play(); last = name } current!.time = time % Math.max(.001, clips.get(name)!.duration); mixer.update(0) }
            root.position.set(0, floor, 0); root.rotation.y = turn; root.scale.z = Math.abs(root.scale.z); sync()
            if (!grounded) { const posed = new T.Box3().setFromObject(body, true); floor -= posed.min.y; root.position.y = floor; grounded = true; sync() }
        }, pose(clip: string, time: number, turn = 0, x = 0, z = 4.15) {
            const name = clips.has(clip) ? clip : clips.has('fighting_victory_start') ? 'fighting_victory_start' : clips.has('fighting_idle') ? 'fighting_idle' : [...clips.keys()][0]
            if (name && clips.has(name)) {
                if (name !== last) {
                    current?.stop()
                    current = mixer.clipAction(clips.get(name)!)
                    current.setLoop(T.LoopRepeat, Infinity)
                    current.clampWhenFinished = false
                    current.play()
                    last = name
                }
                const duration = Math.max(.001, clips.get(name)!.duration)
                current!.time = Math.min(duration - .001, Math.max(0, time))
                mixer.update(0)
            }
            root.position.set(x, floor, z)
            root.rotation.y = turn
            root.scale.z = Math.abs(root.scale.z)
            root.visible = true
            sync()
            if (!grounded) { const posed = new T.Box3().setFromObject(body, true); floor -= posed.min.y; root.position.y = floor; grounded = true; sync() }
        }, clipDuration(name: string) {
            return clips.get(name)?.duration ?? 0
        }, dispose() { park() }
    }
}
