import * as T from 'three'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { action, FIGHTER_PRESENCE, FIGHTER_TARGET_HEIGHT, WORLD_PER_SIM, isGuardInput } from '../shared/combat'
import type { Fighter } from '../shared/combat'
import { healHeroMaterials, loadGltf } from './asset-cache'
export { FIGHTER_PRESENCE }

type Kit = { body: string; parts: string[] }
export type SkinOption = { id: string; name: string }

function files(folder: string, names: string[]): Kit {
    return { body: `/fighters/${folder}/${names[0]}.glb`, parts: names.slice(1).map(name => `/fighters/${folder}/${name}.glb`) }
}
function skinParts(folder: string, skin: string, names: string[]) {
    return names.map(name => `/fighters/${folder}/skins/${skin}/${name}.glb`)
}

export const fighterSkins: Record<string, SkinOption[]> = {
    tusk: [
        { id: 'default', name: 'Default' },
        { id: 'frostiron', name: 'Frostiron Raider' },
        { id: 'frozen_sea', name: 'King of the Frozen Sea' },
        { id: 'icelord', name: 'Ice Lord' },
    ],
    bristleback: [
        { id: 'default', name: 'Default' },
        { id: 'fisherman', name: 'Evil Eye Fisherman' },
        { id: 'arena', name: 'Warrior of the Arena' },
        { id: 'wrathrunner', name: 'Wrath Runner' },
    ],
    vengeful: [
        { id: 'default', name: 'Arcana' },
        { id: 'seraph', name: 'Lost Seraph' },
        { id: 'countess', name: 'Dark Arts Countess' },
        { id: 'forsaken', name: 'Forsaken Wings' },
    ],
    marci: [
        { id: 'default', name: 'Default' },
        { id: 'dragon', name: 'Dragon School' },
        { id: 'bloom', name: 'Bloomjewel' },
        { id: 'lotus', name: 'Lotus Keeper' },
    ],
    dawnbreaker: [
        { id: 'default', name: 'Default' },
        { id: 'first_light', name: 'First Light' },
        { id: 'judgement', name: 'Judgement of Light' },
        { id: 'astral', name: 'Astral Angel' },
    ],
}

const kits: Record<string, Record<string, Kit>> = {
    tusk: {
        default: files('tuskarr', ['tuskarr', 'tusk_armor_glove', 'tusk_cowl', 'tusk_hat', 'tusk_horns', 'tusk_weapon', 'tusk_fish_basket']),
        frostiron: { body: '/fighters/tuskarr/tuskarr.glb', parts: skinParts('tuskarr', 'frostiron', ['frostiron_raider_fist', 'frostiron_raider_cape', 'frostiron_raider_helm', 'frostiron_raider_tusks', 'frostiron_raider_axe', 'frostiron_raider_back']) },
        frozen_sea: { body: '/fighters/tuskarr/tuskarr.glb', parts: skinParts('tuskarr', 'frozen_sea', ['king_of_the_frozen_sea_arms', 'king_of_the_frozen_sea_neck', 'king_of_the_frozen_sea_head', 'king_of_the_frozen_sea_shoulder', 'king_of_the_frozen_sea_weapon', 'king_of_the_frozen_sea_back']) },
        icelord: { body: '/fighters/tuskarr/tuskarr.glb', parts: skinParts('tuskarr', 'icelord', ['icelord_arms', 'icelord_neck', 'icelord_head', 'icelord_shoulder', 'icelord_weapon', 'icelord_back']) },
    },
    bristleback: {
        default: files('bristleback', ['bristleback', 'bristleback_back', 'bristleback_bracer', 'bristleback_head', 'bristleback_necklace', 'bristleback_weapon']),
        fisherman: { body: '/fighters/bristleback/bristleback.glb', parts: skinParts('bristleback', 'fisherman', ['fisherman_with_evil_eye_back', 'fisherman_with_evil_eye_arms', 'fisherman_with_evil_eye_head', 'fisherman_with_evil_eye_neck', 'fisherman_with_evil_eye_weapon']) },
        arena: { body: '/fighters/bristleback/bristleback.glb', parts: skinParts('bristleback', 'arena', ['bristleback_warrior_of_arena_back', 'bristleback_warrior_of_arena_arms', 'bristleback_warrior_of_arena_head', 'bristleback_warrior_of_arena_neck', 'bristleback_warrior_of_arena_weapon']) },
        wrathrunner: { body: '/fighters/bristleback/bristleback.glb', parts: skinParts('bristleback', 'wrathrunner', ['wrathrunner_back', 'wrathrunner_arms', 'wrathrunner_head', 'wrathrunner_neck', 'wrathrunner_weapon']) },
    },
    vengeful: {
        default: files('shendelzare', ['vengeful_spirit_arcana', 'vengeful_spirit_arcana_head_refit', 'vengeful_spirit_arcana_legs_refit', 'vengeful_spirit_arcana_weapon', 'vengeful_spirit_arcana_shoulders']),
        seraph: { body: '/fighters/shendelzare/vengeful_spirit_arcana.glb', parts: skinParts('shendelzare', 'seraph', ['venge_lost_seraph_head_refit', 'venge_lost_seraph_legs_refit', 'venge_lost_seraph_weapon', 'venge_lost_seraph_shoulder']) },
        countess: { body: '/fighters/shendelzare/vengeful_spirit_arcana.glb', parts: skinParts('shendelzare', 'countess', ['dark_arts_countess_head_refit', 'dark_arts_countess_legs_refit', 'dark_arts_countess_weapon', 'dark_arts_countess_shoulder']) },
        forsaken: { body: '/fighters/shendelzare/vengeful_spirit_arcana.glb', parts: skinParts('shendelzare', 'forsaken', ['forsaken_wings_head_refit', 'forsaken_wings_legs_refit', 'forsaken_wings_weapon', 'forsaken_wings_shoulder']) },
    },
    marci: {
        default: files('marci', ['marci_base', 'marci_back', 'marci_costume', 'marci_head', 'marci_shoulders']),
        dragon: { body: '/fighters/marci/marci_base.glb', parts: skinParts('marci', 'dragon', ['monk_of_the_dragon_school_back', 'monk_of_the_dragon_school_armor', 'monk_of_the_dragon_school_head', 'monk_of_the_dragon_school_shoulders']) },
        bloom: { body: '/fighters/marci/marci_base.glb', parts: skinParts('marci', 'bloom', ['marci_blooming_ornaments_back', 'marci_blooming_ornaments_armor', 'marci_blooming_ornaments_head', 'marci_blooming_ornaments_shoulder']) },
        lotus: { body: '/fighters/marci/marci_base.glb', parts: skinParts('marci', 'lotus', ['marci_lotus_keeper_back', 'marci_lotus_keeper_armor', 'marci_lotus_keeper_head', 'marci_lotus_keeper_shoulder']) },
    },
    dawnbreaker: {
        default: files('dawnbreaker', ['dawnbreaker', 'dawnbreaker_armor', 'dawnbreaker_arms', 'dawnbreaker_head', 'dawnbreaker_weapon']),
        first_light: { body: '/fighters/dawnbreaker/dawnbreaker.glb', parts: skinParts('dawnbreaker', 'first_light', ['first_light_armor', 'first_light_arms', 'first_light_head', 'first_light_weapon']) },
        judgement: { body: '/fighters/dawnbreaker/dawnbreaker.glb', parts: skinParts('dawnbreaker', 'judgement', ['judgement_of_light_armor', 'judgement_of_light_arms', 'judgement_of_light_head', 'judgment_of_light_weapon']) },
        astral: { body: '/fighters/dawnbreaker/dawnbreaker.glb', parts: skinParts('dawnbreaker', 'astral', ['dawnbreaker_astral_angel_armor', 'dawnbreaker_astral_angel_arms', 'dawnbreaker_astral_angel_head', 'dawnbreaker_astral_angel_weapon']) },
    },
}

export const fighterIds = Object.keys(fighterSkins)
const names: Record<string, string> = { tusk: 'Tusk', bristleback: 'Bristleback', vengeful: 'Shendelzare', dawnbreaker: 'Dawnbreaker', marci: 'Marci' }
export function pickLocalRival(playerHero: string, random = Math.random) {
    const pool = fighterIds.filter(id => id !== playerHero)
    const hero = pool[Math.floor(random() * pool.length)] || 'tusk'
    const skins = fighterSkins[hero] ?? []
    const alts = skins.filter(option => option.id !== 'default')
    const choices = alts.length ? alts : skins
    const skin = choices[Math.floor(random() * choices.length)]?.id ?? 'default'
    return { hero, skin }
}
export function resolveSkin(id: string, skin = 'default') {
    return fighterSkins[id]?.some(option => option.id === skin) ? skin : 'default'
}
export function fighterKit(id: string, skin = 'default') {
    const resolved = resolveSkin(id, skin)
    return kits[id][resolved] ?? kits[id].default
}
export const fighterJobs = fighterIds.flatMap(id => {
    const kit = fighterKit(id, 'default')
    return [kit.body, ...kit.parts].map(url => ({ url, label: names[id] }))
})
export function fighterSkinJobs(id: string, skin = 'default') {
    const kit = fighterKit(id, skin)
    return [kit.body, ...kit.parts].map(url => ({ url, label: names[id] }))
}
function pileKey(id: string, skin: string) { return `${id}::${resolveSkin(id, skin)}` }
const dawnYaw = { right: Math.PI / 2 - 200 * Math.PI / 180, left: Math.PI / 2 - 50 * Math.PI / 180 }
const dawnPresentYaw = (face: number) => -Math.PI / 2 + (face > 0 ? .82 : -.82)
const dawnFightYaw = -Math.PI / 2 + 0.28
type FighterModel = Awaited<ReturnType<typeof loadFighter>>
const pools = new Map<number, Map<string, FighterModel[]>>()
function pile(presence: number, id: string, skin = 'default') {
    const key = pileKey(id, skin)
    let group = pools.get(presence)
    if (!group) { group = new Map(); pools.set(presence, group) }
    let items = group.get(key)
    if (!items) { items = []; group.set(key, items) }
    return items
}
export function fighterStocked(id: string, presence = 1, skin = 'default') { return pile(presence, id, skin).length > 0 }
const restockQueue: { id: string; presence: number; skin: string }[] = []
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
        void loadFighter(job.id, job.presence, job.skin).then(model => {
            const cap = job.presence === 1 ? 1 : 2
            if (pile(job.presence, job.id, job.skin).length < cap) pile(job.presence, job.id, job.skin).push(model)
        }).catch(() => { }).finally(pumpRestock)
    })
}
export function acquireFighter(id: string, presence = 1, skin = 'default') {
    const resolved = resolveSkin(id, skin)
    const cached = pile(presence, id, resolved).pop()
    if (cached) {
        healHeroMaterials(cached.root)
        if (presence !== 1) { restockQueue.push({ id, presence, skin: resolved }); if (!restocking) pumpRestock() }
        return Promise.resolve(cached)
    }
    return loadFighter(id, presence, resolved)
}
export function releaseFighter(model: FighterModel) {
    model.park()
    model.root.removeFromParent()
    const cap = model.presence === 1 ? 1 : 2
    const items = pile(model.presence, model.hero, model.skin)
    if (items.length < cap) items.push(model)
}
export async function ensureStock(id: string, presence: number, copies: number, skin = 'default') {
    const resolved = resolveSkin(id, skin)
    const items = pile(presence, id, resolved)
    const missing = Math.max(0, copies - items.length)
    if (!missing) return
    const made = await Promise.all(Array.from({ length: missing }, () => loadFighter(id, presence, resolved).catch(() => null)))
    items.push(...made.filter((model): model is FighterModel => !!model))
}
export async function stockFighters(presence: number, copies: number) {
    for (const id of fighterIds) {
        const made = await Promise.all(Array.from({ length: copies }, () => loadFighter(id, presence).catch(() => null)))
        pile(presence, id).push(...made.filter((model): model is FighterModel => !!model))
    }
}
export async function loadFighter(id: string, presence = 1, skin = 'default') {
    const resolved = resolveSkin(id, skin)
    const kit = fighterKit(id, resolved)
    const loadedParts = await Promise.all(kit.parts.map(part => loadGltf(part).catch(() => null)))
    const gltfs = [await loadGltf(kit.body), ...loadedParts.filter((part): part is NonNullable<typeof part> => !!part)]
    const root = new T.Group(), body = cloneSkinned(gltfs[0].scene); root.add(body); root.updateMatrixWorld(true)
    const baseBones = new Map<string, T.Bone>(); body.traverse(o => { if ((o as T.Bone).isBone) baseBones.set(o.name.toLowerCase(), o as T.Bone) })
    const followers: { bone: T.Bone; source: T.Bone; offset: T.Matrix4 }[] = []
    const spearRigs: { part: T.Object3D; source: T.Bone; offset: T.Matrix4; local: T.Matrix4 }[] = []
    const unmatched: string[] = []
    const alignDelta = new T.Matrix4()
    const sourceQuat = new T.Quaternion()
    const accessoryQuat = new T.Quaternion()
    const sourcePos = new T.Vector3()
    const accessoryPos = new T.Vector3()
    function alignAccessory(partScene: T.Object3D) {
        let anchor: T.Bone | undefined
        let named: T.Bone | undefined
        partScene.traverse(object => {
            if (!(object as T.Bone).isBone) return
            const bone = object as T.Bone
            const key = bone.name.toLowerCase()
            if (!baseBones.has(key) || /_end/.test(key)) return
            if (!named && (key === 'pelvis' || key === 'weapon_0' || key === 'spine_0')) named = bone
            anchor ??= bone
        })
        const accessoryBone = named ?? anchor
        const source = accessoryBone && baseBones.get(accessoryBone.name.toLowerCase())
        if (!source || !accessoryBone) return
        source.updateMatrixWorld(true)
        accessoryBone.updateMatrixWorld(true)
        source.getWorldQuaternion(sourceQuat)
        accessoryBone.getWorldQuaternion(accessoryQuat)
        // First Light (and similar sets) ship a 90° bind axis vs the hero body.
        // Identity follow preserves that tilt; snap the accessory into the body bind first.
        if (sourceQuat.angleTo(accessoryQuat) < 0.35) return
        alignDelta.copy(accessoryBone.matrixWorld).invert().premultiply(source.matrixWorld)
        partScene.applyMatrix4(alignDelta)
        partScene.updateMatrixWorld(true)
    }
    function bindSpear(partScene: T.Object3D, spear: T.Bone, bodySpear: T.Bone) {
        bodySpear.updateMatrixWorld(true)
        spear.updateMatrixWorld(true)
        bodySpear.getWorldPosition(sourcePos)
        spear.getWorldPosition(accessoryPos)
        // Alt Vengeful weapons are authored against the default skeleton, where
        // spear_1 already sits in the grip. Arcana rest leaves that helper at the
        // origin, so per-bone follow stretches the mesh into space. Snap the
        // accessory onto the body helper and carry the whole GLB with it.
        if (accessoryPos.distanceTo(sourcePos) > 0.25) {
            alignDelta.copy(spear.matrixWorld).invert().premultiply(bodySpear.matrixWorld)
            partScene.applyMatrix4(alignDelta)
            partScene.updateMatrixWorld(true)
        }
        spear.updateMatrixWorld(true)
        spearRigs.push({
            part: partScene,
            source: bodySpear,
            offset: bodySpear.matrixWorld.clone().invert().multiply(spear.matrixWorld),
            local: partScene.matrixWorld.clone().invert().multiply(spear.matrixWorld),
        })
    }
    function sourceBone(name: string) {
        const key = name.toLowerCase()
        const direct = baseBones.get(key)
        if (direct) return direct
        const seraphWing = key.match(/^lost_seraph_shoulder_wing_(0|1|2|end)_([lr])$/)
        if (seraphWing) {
            const slot = { '0': 'arcanawing_0_', '1': 'arcanawing_1_', '2': 'arcanawing_2_', end: 'arcanawing_finger_0_' }[seraphWing[1]]
            return slot ? baseBones.get(slot + seraphWing[2]) : undefined
        }
        const countessWing = key.match(/^wing_([lr])_0([1-5])_jnt$/)
        if (countessWing) {
            const chain = ['arcanawing_root_', 'arcanawing_0_', 'arcanawing_1_', 'arcanawing_2_', 'arcanawing_finger_0_']
            return baseBones.get(chain[Number(countessWing[2]) - 1] + countessWing[1])
        }
        if (key === 'hair2_0') return baseBones.get('arcanahaira_0')
        if (key === 'hair2_1') return baseBones.get('arcanahaira_1')
        if (key === 'shoulder_r') return baseBones.get('arcanashouldera_0_r')
        if (key === 'shoulder_l') return baseBones.get('arcanashouldera_0_l')
        return undefined
    }
    function bodySkinnedRatio(partScene: T.Object3D, skip: string) {
        let body = 0, total = 0
        partScene.traverse(object => {
            const mesh = object as T.SkinnedMesh
            if (!mesh.isSkinnedMesh || !mesh.skeleton || !mesh.geometry) return
            const skin = mesh.geometry.attributes.skinIndex
            const weight = mesh.geometry.attributes.skinWeight
            if (!skin || !weight) return
            for (let i = 0; i < skin.count; i++) {
                for (let k = 0; k < 4; k++) {
                    const index = k === 0 ? skin.getX(i) : k === 1 ? skin.getY(i) : k === 2 ? skin.getZ(i) : skin.getW(i)
                    const amount = k === 0 ? weight.getX(i) : k === 1 ? weight.getY(i) : k === 2 ? weight.getZ(i) : weight.getW(i)
                    const bone = mesh.skeleton.bones[index]
                    if (!bone || amount <= 0) continue
                    total += amount
                    const key = bone.name.toLowerCase()
                    if (key === skip) continue
                    if (baseBones.has(key)) body += amount
                }
            }
        })
        return total > 0 ? body / total : 0
    }
    for (const part of gltfs.slice(1)) {
        const partScene = cloneSkinned(part.scene); root.add(partScene); root.updateMatrixWorld(true)
        let spear: T.Bone | undefined
        partScene.traverse(object => {
            if ((object as T.Bone).isBone && object.name.toLowerCase() === 'spear_1') spear = object as T.Bone
        })
        const bodySpear = spear && baseBones.get('spear_1')
        // Lost Seraph skins forearm verts to elbow_R. Rigid spear follow leaves that
        // bracer floating off the shaft. Keep per-bone follow when the mesh still
        // uses other body bones; origin-space spears stay rigid.
        if (spear && bodySpear && bodySkinnedRatio(partScene, 'spear_1') < 0.05) {
            bindSpear(partScene, spear, bodySpear)
            continue
        }
        alignAccessory(partScene)
        partScene.traverse(o => {
            if (!(o as T.Bone).isBone) return
            const source = sourceBone(o.name)
            if (source) followers.push({ bone: o as T.Bone, source, offset: source.matrixWorld.clone().invert().multiply(o.matrixWorld) })
            else unmatched.push(o.name)
        })
    }
    // Preserve each accessory bind transform. Apply the animated body bone delta in world space,
    // then convert back through the actual accessory parent; hierarchy differences are supported.
    const scratchWorld = new T.Matrix4(), scratchLocal = new T.Matrix4()
    function sync() {
        root.updateMatrixWorld(true)
        for (const { bone, source, offset } of followers) {
            scratchWorld.copy(source.matrixWorld).multiply(offset)
            scratchLocal.copy(bone.parent!.matrixWorld).invert().multiply(scratchWorld)
            scratchLocal.decompose(bone.position, bone.quaternion, bone.scale)
            bone.updateMatrixWorld(true)
        }
        for (const { part, source, offset, local } of spearRigs) {
            scratchWorld.copy(source.matrixWorld).multiply(offset).multiply(alignDelta.copy(local).invert())
            scratchLocal.copy(part.parent!.matrixWorld).invert().multiply(scratchWorld)
            scratchLocal.decompose(part.position, part.quaternion, part.scale)
            part.updateMatrixWorld(true)
        }
    }
    const mixer = new T.AnimationMixer(body), clips = new Map<string, T.AnimationClip>(gltfs[0].animations.map(c => [c.name, c])); let current: T.AnimationAction | null = null, last = '', lastPoseFrame = -1, previousX = NaN, walkHold = 0, walkDir = 0, outro = 0, outroAction = '', outroAt = 0
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
    healHeroMaterials(root)
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
        root, unmatched, hero: id, skin: resolved, presence, park, resetMotion, clips: [...clips.keys()], update(f: Fighter) {
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
            if (id === 'dawnbreaker') {
                root.rotation.y = dawnFightYaw
                // Bind faces a different axis than the roster, so P1 is a Z-mirror.
                // Flip that mirror with facing — keep the same 3/4 yaw as P1.
                root.scale.z = -Math.abs(root.scale.z) * Math.sign(f.face || 1)
            }
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
        }, stage(clip: string, time: number, x: number, face: number, loop = true, towardCamera = false) {
            const name = clips.has(clip) ? clip : clips.has('fighting_advancing') ? 'fighting_advancing' : clips.has('fighting_idle') ? 'fighting_idle' : [...clips.keys()][0]
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
                current!.time = loop ? ((time % duration) + duration) % duration : Math.min(duration - .001, Math.max(0, time))
                mixer.update(0)
            }
            root.position.set(x, floor, 4.15)
            if (towardCamera && id === 'dawnbreaker') {
                root.rotation.y = dawnPresentYaw(face)
                root.scale.z = Math.abs(root.scale.z)
            } else if (id === 'dawnbreaker') {
                root.rotation.y = face > 0 ? dawnYaw.left : dawnYaw.right
                root.scale.z = Math.abs(root.scale.z)
            } else {
                root.rotation.y = Math.PI / 2
                root.scale.z = Math.abs(root.scale.z) * face
            }
            root.visible = true
            sync()
            if (!grounded) { const posed = new T.Box3().setFromObject(body, true); floor -= posed.min.y; root.position.y = floor; grounded = true; sync() }
        }, clipDuration(name: string) {
            return clips.get(name)?.duration ?? 0
        }, dispose() { park() }
    }
}
