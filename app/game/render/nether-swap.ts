import * as T from 'three'
import { FIGHTER_PRESENCE } from './fighters'

export type SwapBurst = { root: T.Object3D; update: (time: number) => boolean; dispose: () => void }

/** Purple Nether Swap burst — portals at both fighters when Shendelzare's 2nd special connects. */
export function netherSwapFx() {
  const loader = new T.TextureLoader()
  const maps = new Map<string, T.Texture>()
  const tex = (name: string) => {
    let map = maps.get(name)
    if (!map) {
      map = loader.load(`/effects/vengeful/${name}.png`)
      map.colorSpace = T.SRGBColorSpace
      maps.set(name, map)
    }
    return map
  }

  function create(at: { x: number; y: number; z: number }, face: number, born: number): SwapBurst {
    const root = new T.Group()
    root.position.set(at.x, at.y, at.z)
    const mats: T.SpriteMaterial[] = []
    const sprite = (name: string, color: number, size: number) => {
      const material = new T.SpriteMaterial({
        map: tex(name),
        color,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        toneMapped: false,
        blending: T.AdditiveBlending,
      })
      mats.push(material)
      const node = new T.Sprite(material)
      node.scale.setScalar(size)
      node.renderOrder = 22
      node.frustumCulled = false
      root.add(node)
      return node
    }

    const glow = sprite('particle_glow_05', 0xb14cff, 2.4)
    const core = sprite('aircraft_white_v2', 0xf0d0ff, 1.4)
    const ring = sprite('particle_cone_gradient_1', 0xd48bff, 1.8)
    const sparks = Array.from({ length: 10 }, (_, i) => {
      const node = sprite('yellowflare2', i % 2 ? 0xff9be8 : 0xc56bff, 0.35)
      return { node, angle: (i / 10) * Math.PI * 2, spin: 1.2 + (i % 3) * 0.35, rise: 0.4 + (i % 4) * 0.12 }
    })

    const life = 0.72
    return {
      root,
      update(time) {
        const age = Math.max(0, (time - born) / 1000)
        const t = Math.min(1, age / life)
        const pulse = t < 0.18 ? t / 0.18 : Math.max(0, 1 - (t - 0.18) / 0.82)
        glow.scale.setScalar((2.2 + t * 3.4) * FIGHTER_PRESENCE)
        glow.material.opacity = pulse * 0.85
        glow.material.rotation = age * 1.4 * face
        core.scale.setScalar((1.1 + Math.sin(age * 18) * 0.15 + t * 0.8) * FIGHTER_PRESENCE)
        core.material.opacity = pulse * 0.95
        ring.scale.setScalar((1.4 + t * 2.8) * FIGHTER_PRESENCE)
        ring.material.opacity = pulse * 0.7
        ring.material.rotation = -age * 2.2 * face
        for (const spark of sparks) {
          const a = spark.angle + age * spark.spin
          const radius = (0.35 + t * 1.6) * FIGHTER_PRESENCE
          spark.node.position.set(Math.cos(a) * radius * face, Math.sin(a) * radius * 0.55 + age * spark.rise, 0.04)
          spark.node.scale.setScalar((0.22 + (1 - t) * 0.28) * FIGHTER_PRESENCE)
          spark.node.material.opacity = pulse * 0.9
        }
        return age < life
      },
      dispose() {
        for (const material of mats) material.dispose()
      },
    }
  }

  return {
    create,
    dispose() {
      for (const map of maps.values()) map.dispose()
      maps.clear()
    },
  }
}
