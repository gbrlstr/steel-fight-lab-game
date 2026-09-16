import * as T from 'three'
import { FIGHTER_PRESENCE } from './fighters'

export type WalrusBurst = { root: T.Object3D; update: (time: number) => boolean; dispose: () => void }

/** Tusk Walrus Punch (2nd special) — icy uppercut smash. */
export function tuskWalrusPunchFx() {
  const loader = new T.TextureLoader()
  const maps = new Map<string, T.Texture>()
  const load = (path: string) => {
    let map = maps.get(path)
    if (!map) {
      map = loader.load(path)
      map.colorSpace = T.SRGBColorSpace
      maps.set(path, map)
    }
    return map
  }
  const hit = (name: string) => load(`/effects/hit/${name}.png`)
  const frost = Array.from({ length: 16 }, (_, i) => load(`/effects/tusk/frost_seq0_${i * 2}.png`))
  const crystal = () => load('/effects/tusk/crystal_seq0.png')

  function create(at: { x: number; y: number; z: number }, face: number, born: number): WalrusBurst {
    const root = new T.Group()
    root.position.set(at.x, at.y, at.z)
    const mats: T.SpriteMaterial[] = []
    const sprite = (map: T.Texture, color: number, size: number) => {
      const material = new T.SpriteMaterial({
        map,
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

    const glow = sprite(hit('particle_glow_08'), 0x8ecfff, 2.6)
    const flash = sprite(hit('particle_flare_006_white'), 0xe8f7ff, 1.9)
    const ring = sprite(hit('particle_heroring_bad'), 0xb8e8ff, 2.0)
    const core = sprite(hit('stylized_explosion_sprite'), 0xd4f0ff, 1.35)
    const shards = Array.from({ length: 12 }, (_, i) => {
      const node = sprite(i % 3 ? frost[0]! : crystal(), i % 2 ? 0xc8ecff : 0x9ad4ff, 0.4)
      return { node, angle: (i / 12) * Math.PI * 2, spin: 0.9 + (i % 4) * 0.25, rise: 0.45 + (i % 5) * 0.1 }
    })

    const life = 0.85
    return {
      root,
      update(time) {
        const age = Math.max(0, (time - born) / 1000)
        const t = Math.min(1, age / life)
        const pulse = t < 0.16 ? t / 0.16 : Math.max(0, 1 - (t - 0.16) / 0.84)
        const frame = Math.min(15, Math.floor(t * 16))
        glow.scale.setScalar((2.4 + t * 3.2) * FIGHTER_PRESENCE)
        glow.material.opacity = pulse * 0.8
        flash.scale.setScalar((1.4 + Math.sin(age * 18) * 0.2 + t * 1.0) * FIGHTER_PRESENCE)
        flash.material.opacity = pulse * 0.95
        flash.material.rotation = age * 2.2 * face
        ring.scale.setScalar((1.5 + t * 3.4) * FIGHTER_PRESENCE)
        ring.material.opacity = pulse * 0.65
        ring.material.rotation = -age * 1.5 * face
        core.scale.setScalar((1.0 + t * 1.7) * FIGHTER_PRESENCE)
        core.material.opacity = pulse * 0.85
        core.material.rotation = age * 2.8
        for (const shard of shards) {
          const a = shard.angle + age * shard.spin
          const radius = (0.35 + t * 1.7) * FIGHTER_PRESENCE
          shard.node.material.map = frost[frame]!
          shard.node.position.set(
            Math.cos(a) * radius * face * 0.85 + face * t * 0.35,
            Math.sin(a) * radius * 0.45 + age * shard.rise + t * 0.4,
            0.05,
          )
          shard.node.scale.setScalar((0.22 + (1 - t) * 0.38) * FIGHTER_PRESENCE)
          shard.node.material.opacity = pulse * 0.9
          shard.node.material.rotation = a + age
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
