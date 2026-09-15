import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const loader = new GLTFLoader()

export type TuskarModel = {
  model: THREE.Group
  animations: THREE.AnimationClip[]
}

export function loadTuskarModel() {
  return new Promise<TuskarModel>((resolve, reject) => {
    loader.load(
      '/models/tuskarr.glb',
      (gltf) => {
        const model = gltf.scene

        model.position.set(0, 0, 0)
        model.rotation.set(0, 0, 0)
        model.scale.set(0.1, 0.1, 0.1)

        applyTuskarMaterials(model)

        resolve({
          model,
          animations: gltf.animations,
        })
      },
      undefined,
      reject,
    )
  })
}

export function fitModelToGround(model: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(model)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())

  model.position.x -= center.x
  model.position.z -= center.z
  model.position.y -= box.min.y

  return {
    size,
    center,
    height: size.y,
  }
}

function loadTexture(path: string, isColor = true, flipY = false) {
  const texture = new THREE.TextureLoader().load(path)

  texture.flipY = flipY
  texture.wrapS = THREE.RepeatWrapping
  texture.needsUpdate = true

  if (isColor) {
    texture.colorSpace = THREE.SRGBColorSpace
  }

  return texture
}

function createTuskarMaterial(options: {
  color: string
  flipY?: boolean
  alphaTest?: boolean
}) {
  const map = loadTexture(options.color, true, options.flipY ?? false)

  const material = new THREE.MeshStandardMaterial({
    map,
    roughness: 0.9,
    metalness: 0.05,
    side: THREE.DoubleSide,
  })

  if (options.alphaTest) {
    material.transparent = true
    material.alphaTest = 0.5
    material.depthWrite = true
  }

  return material
}

function applyTuskarMaterials(model: THREE.Object3D) {
  const materials = {
    base: createTuskarMaterial({
      color: '/material/tuskar/tusk_base_color_psd_3f204cbb.png',
      flipY: false,
    }),

    armorGlove: createTuskarMaterial({
      color: '/material/tuskar/tusk_armor_glove_color_psd_1fe32aae.png',
      flipY: false,
    }),

    horns: createTuskarMaterial({
      color: '/material/tuskar/tusk_horns_color_psd_555eacc4.png',
      flipY: false,
      alphaTest: true,
    }),

    cowl: createTuskarMaterial({
      color: '/material/tuskar/tusk_cowl_color_psd_fc2453b9.png',
      flipY: false,
    }),

    hat: createTuskarMaterial({
      color: '/material/tuskar/tusk_hat_color_psd_c5064d12.png',
      flipY: false,
    }),

    weapon: createTuskarMaterial({
      color: '/material/tuskar/tusk_weapon_color_psd_a08273e3.png',
      flipY: false,
    }),

    fish: createTuskarMaterial({
      color: '/material/tuskar/tusk_fish_color_psd_92a3ae7d.png',
      flipY: false,
    }),
  }

  model.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return

    const mesh = child as THREE.Mesh
    const name = mesh.name.toLowerCase()

    if (name.includes('tusk_model_1')) {
      mesh.material = materials.base
    } else if (name.includes('tusk_model_2')) {
      mesh.material = materials.armorGlove
    } else if (name.includes('tusk_model_3')) {
      mesh.material = materials.horns
    } else if (name.includes('tusk_model_4')) {
      mesh.material = materials.cowl
    } else if (name.includes('tusk_model_5')) {
      mesh.material = materials.hat
    } else if (name.includes('tusk_model_6')) {
      mesh.material = materials.weapon
    } else if (name.includes('tusk_model_7')) {
      mesh.material = materials.fish
    }

    mesh.castShadow = true
    mesh.receiveShadow = true
  })
}
