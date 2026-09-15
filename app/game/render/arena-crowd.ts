import * as T from 'three'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { loadGltf } from './asset-cache'

type Patron = {
  file: string
  clip: string
  /** Column-major instance matrix from arena-scene.glb (Source inches already converted). */
  matrix: number[]
  /** portrait_world_unit modelscale. The baked scene matrix is unit-scale. */
  scale: number
  /** Default loadout pieces. The base vmdl is only the body. */
  parts?: string[]
}

// Node matrices from public/arena/arena-scene.glb. The map export places
// penguin, tuskfolk and eight crystal_maiden stand-ins (the real hero is mapunitname).
const PATRONS: Patron[] = [
  { file: 'models/events/frostivus/penguin/penguin_alt.glb', clip: 'penguin_idle_stepped', scale: 1, matrix: [-0.021997, 0, 0.0127, 0, 0.0127, 0, 0.021997, 0, 0, 0.0254, 0, 0, -20.431122, 4.12525, -5.223348, 1] },
  { file: 'models/creeps/ice_biome/tuskfolk/tuskfolk001b_f.glb', clip: 'tuskfolk_fighting_game_idle', scale: 1, matrix: [-0.021605, -0.004772, -0.012474, 0, -0.0127, 0, 0.021997, 0, -0.004132, 0.024948, -0.002386, 0, -18.93449, 4.295766, 16.042843, 1] },
  // { file: 'models/heroes/crystal_maiden/crystal_maiden.glb', clip: 'idle_loadout_facial', scale: 1.4, matrix: [-0.025242, -0.000366, 0.002807, 0, 0.00282, -0.00104, 0.025222, 0, -0.000249, 0.025376, 0.001074, 0, 4.856188, 4.096431, 3.228062, 1], parts: ['models/heroes/crystal_maiden/crystal_maiden_cape.glb', 'models/heroes/crystal_maiden/crystal_maiden_cuffs.glb', 'models/heroes/crystal_maiden/crystal_maiden_shoulders.glb'] },
  // { file: 'models/heroes/lina/lina.glb', clip: 'background_idle', scale: 1.4, matrix: [-0.014989, -0.000366, 0.020503, 0, 0.020496, -0.00104, 0.014966, 0, 0.000623, 0.025376, 0.000909, 0, -9.969421, 4.102579, -2.233272, 1], parts: ['models/heroes/lina/lina_arms.glb', 'models/heroes/lina/lina_belt.glb', 'models/heroes/lina/lina_head.glb', 'models/heroes/lina/lina_neck.glb'] },
  { file: 'models/heroes/lich/lich.glb', clip: 'background_idle', scale: 1.4, matrix: [-0.015052, -0.000366, -0.020456, 0, -0.020432, -0.00104, 0.015053, 0, -0.001054, 0.025376, 0.000321, 0, 7.426005, 4.199132, 15.529851, 1], parts: ['models/heroes/lich/lich_bracer.glb', 'models/heroes/lich/lich_dress.glb', 'models/heroes/lich/lich_horns.glb'] },
  { file: 'models/heroes/tuskarr/tuskarr.glb', clip: 'background_idle', scale: 1.4, matrix: [-0.025108, -0.000366, -0.003821, 0, -0.003804, -0.00104, 0.025092, 0, -0.000518, 0.025376, 0.000973, 0, -12.06469, 4.162744, 0.337837, 1], parts: ['/fighters/tuskarr/tusk_armor_glove.glb', '/fighters/tuskarr/tusk_cowl.glb', '/fighters/tuskarr/tusk_hat.glb', '/fighters/tuskarr/tusk_horns.glb'] },
  { file: 'models/heroes/vengeful/vengeful.glb', clip: 'loadout', scale: 1.2, matrix: [-0.023041, -0.000366, -0.010683, 0, -0.010662, -0.00104, 0.023031, 0, -0.000769, 0.025376, 0.000789, 0, -18.677507, 4.122999, 9.691848, 1], parts: ['/fighters/vengeful/vengeful_hair.glb', '/fighters/vengeful/vengeful_lowerbody.glb', '/fighters/vengeful/vengeful_upperbody.glb'] },
  { file: 'models/heroes/bristleback/bristleback.glb', clip: 'background_idle', scale: 1.4, matrix: [-0.010683, -0.000366, 0.023041, 0, 0.023031, -0.00104, 0.010662, 0, 0.000789, 0.025376, 0.000769, 0, -17.881598, 4.438232, -3.251199, 1], parts: ['/fighters/bristleback/bristleback_back.glb', '/fighters/bristleback/bristleback_bracer.glb', '/fighters/bristleback/bristleback_head.glb', '/fighters/bristleback/bristleback_necklace.glb'] },
  // { file: 'models/heroes/broodmother/broodmother.glb', clip: 'background_idle', scale: 2, matrix: [-0.023041, -0.000366, -0.010683, 0, -0.010662, -0.00104, 0.023031, 0, -0.000769, 0.025376, 0.000789, 0, 3.583211, 4.200787, 19.507196, 1], parts: ['models/heroes/broodmother/broodmother_abdomen.glb', 'models/heroes/broodmother/broodmother_hair.glb', 'models/heroes/broodmother/broodmother_legs.glb'] },
  // { file: 'models/heroes/winterwyvern/winterwyvern.glb', clip: 'background_idle', scale: 2, matrix: [-0.023041, -0.000366, -0.010683, 0, -0.010662, -0.00104, 0.023031, 0, -0.000769, 0.025376, 0.000789, 0, -2.57615, 4.363874, 9.741944, 1], parts: ['models/heroes/winterwyvern/winterwyvern_backitem.glb', 'models/heroes/winterwyvern/winterwyvern_crown.glb'] },
]

function sceneOrClone(source: T.Object3D) {
  try { return cloneSkinned(source) } catch { return source }
}

function partUrl(file: string) {
  return file.startsWith('/') ? file : '/arena/crowd/' + file
}

export function crowdAssetUrls() {
  const urls = new Set<string>()
  for (const patron of PATRONS) {
    urls.add('/arena/crowd/' + patron.file)
    for (const part of patron.parts ?? []) urls.add(partUrl(part))
  }
  return [...urls]
}

function prepareMeshes(root: T.Object3D) {
  root.traverse((child) => {
    const mesh = child as T.Mesh
    if (!mesh.isMesh) return
    mesh.frustumCulled = false
    mesh.castShadow = false
    mesh.receiveShadow = true
  })
}

function pickBone(body: T.Object3D, file: string) {
  const bones: T.Bone[] = []
  body.traverse((child) => {
    if ((child as T.Bone).isBone) bones.push(child as T.Bone)
  })
  const find = (pattern: RegExp) => bones.find((bone) => pattern.test(bone.name))
  const root = find(/^root(_0)?$/i) ?? find(/pelvis/i) ?? bones[0]
  if (/head|hat|horn|hair|crown/.test(file)) return find(/^head(_0)?$/i) ?? find(/head/i) ?? root
  if (/neck/.test(file)) return find(/neck/i) ?? find(/head/i) ?? root
  if (/staff|weapon/.test(file)) return find(/weapon/i) ?? find(/hand/i) ?? root
  if (/glove|bracer|cuff|arms/.test(file)) return find(/forearm|wrist|hand/i) ?? root
  return root
}

function pinRigid(body: T.Object3D, piece: T.Object3D, file: string) {
  if (piece.getObjectByProperty('type', 'SkinnedMesh')) return
  const bone = pickBone(body, file)
  if (!bone) return
  body.updateWorldMatrix(true, true)
  piece.updateWorldMatrix(true, true)
  const local = bone.matrixWorld.clone().invert().multiply(piece.matrixWorld)
  bone.add(piece)
  local.decompose(piece.position, piece.quaternion, piece.scale)
  piece.updateMatrix()
}

function bindParts(body: T.Object3D, pieces: T.Object3D[]) {
  const bones = new Map<string, T.Bone>()
  body.updateWorldMatrix(true, true)
  body.traverse((child) => {
    if ((child as T.Bone).isBone) bones.set(child.name.toLowerCase(), child as T.Bone)
  })
  const followers: Array<{ bone: T.Bone; source: T.Bone; offset: T.Matrix4 }> = []
  for (const piece of pieces) {
    piece.updateWorldMatrix(true, true)
    piece.traverse((child) => {
      if (!(child as T.Bone).isBone) return
      const source = bones.get(child.name.toLowerCase())
      if (!source) return
      followers.push({
        bone: child as T.Bone,
        source,
        offset: source.matrixWorld.clone().invert().multiply(child.matrixWorld),
      })
    })
  }
  return () => {
    body.updateWorldMatrix(true, true)
    for (const { bone, source, offset } of followers) {
      if (!bone.parent) continue
      const world = source.matrixWorld.clone().multiply(offset)
      const local = bone.parent.matrixWorld.clone().invert().multiply(world)
      local.decompose(bone.position, bone.quaternion, bone.scale)
      bone.updateMatrixWorld(true)
    }
  }
}

function pickClip(gltf: { animations: T.AnimationClip[] }, name: string) {
  const moving = (clip: T.AnimationClip) => clip.duration > 0.05
  return gltf.animations.find((clip) => clip.name === name && moving(clip))
    ?? gltf.animations.find((clip) => moving(clip) && /background_idle|idle_loadout|loadout|^idle$/i.test(clip.name))
    ?? gltf.animations.find((clip) => clip.name === name)
}

export async function attachArenaCrowd(stage: T.Object3D, scene: T.Scene) {
  const mixers: T.AnimationMixer[] = []
  const syncs: Array<() => void> = []

  await Promise.all(PATRONS.map(async (patron) => {
    try {
      const gltf = await loadGltf('/arena/crowd/' + patron.file)
      const model = sceneOrClone(gltf.scene)
      // The exported skeleton already has VRF's inch/axis matrix. The scene
      // instance matrix includes that same conversion, so only apply the extra
      // placement — wiping the skeleton matrix breaks skinning and the clip.
      const unit = new T.Matrix4()
      model.traverse((child) => {
        const scale = new T.Vector3()
        child.updateMatrix()
        child.matrix.decompose(new T.Vector3(), new T.Quaternion(), scale)
        if (child.position.lengthSq() < 1e-6 && scale.x > 0.02 && scale.x < 0.03) unit.copy(child.matrix)
      })
      const placed = new T.Matrix4().fromArray(patron.matrix)
      if (patron.scale !== 1) placed.multiply(new T.Matrix4().makeScale(patron.scale, patron.scale, patron.scale))
      const pivot = new T.Group()
      pivot.name = 'arenaCrowd'
      placed.multiply(unit.invert()).decompose(pivot.position, pivot.quaternion, pivot.scale)
      pivot.add(model)
      prepareMeshes(model)
      const pieces: T.Object3D[] = []
      const pinned: Array<{ root: T.Object3D; file: string }> = []
      for (const part of patron.parts ?? []) {
        try {
          const extra = sceneOrClone((await loadGltf(partUrl(part))).scene)
          pivot.add(extra)
          prepareMeshes(extra)
          if (extra.getObjectByProperty('type', 'SkinnedMesh')) pieces.push(extra)
          else pinned.push({ root: extra, file: part })
        } catch (error) {
          console.warn('Peca do loadout indisponivel:', part, error)
        }
      }
      pivot.updateMatrixWorld(true)
      for (const piece of pinned) pinRigid(model, piece.root, piece.file)
      if (pieces.length) syncs.push(bindParts(model, pieces))
      const clip = pickClip(gltf, patron.clip)
      if (!clip) {
        console.warn('Arena sem clipe:', patron.file)
        return
      }
      const mixer = new T.AnimationMixer(model)
      const action = mixer.clipAction(clip)
      action.time = Math.random() * clip.duration
      action.play()
      mixers.push(mixer)
      stage.add(pivot)
    } catch (error) {
      console.warn('Personagem da arena indisponivel:', patron.file, error)
    }
  }))

  const previous = scene.userData.tickArena as ((dt: number) => void) | undefined
  scene.userData.tickArena = (dt: number) => {
    previous?.(dt)
    for (const mixer of mixers) mixer.update(dt)
    for (const sync of syncs) sync()
  }
}
