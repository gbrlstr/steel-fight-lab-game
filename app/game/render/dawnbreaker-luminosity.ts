import * as T from 'three'
import { FIGHTER_PRESENCE } from './fighters'

export type LuminosityBurst = { root: T.Object3D; update: (time: number) => boolean; dispose: () => void }

/** Dawnbreaker Luminosity (2nd special) — solar smash burst. */
export function dawnbreakerLuminosityFx() {
  const loader = new T.TextureLoader()
  const maps = new Map<string, T.Texture>()
  const tex = (name: string) => {
    let map = maps.get(name)
    if (!map) {
      map = loader.load(`/effects/hit/${name}.png`)
      map.colorSpace = T.SRGBColorSpace
      maps.set(name, map)
    }
    return map
  }

  function create(at: { x: number; y: number; z: number }, face: number, born: number): LuminosityBurst {
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

    const glow = sprite('particle_glow_08', 0xffc14a, 2.8)
    const flash = sprite('particle_flare_006_white', 0xfff2c4, 2.0)
    const ring = sprite('particle_heroring_bad', 0xffd978, 2.2)
    const core = sprite('stylized_explosion_sprite', 0xffe6a0, 1.4)
    const sparks = Array.from({ length: 14 }, (_, i) => {
      const node = sprite(i % 2 ? 'particle_glow_01' : 'fleks5_seq27', i % 3 ? 0xffe08a : 0xffb43c, 0.34)
      return { node, angle: (i / 14) * Math.PI * 2, spin: 1.1 + (i % 4) * 0.3, rise: 0.3 + (i % 5) * 0.12 }
    })

    const life = 0.9
    return {
      root,
      update(time) {
        const age = Math.max(0, (time - born) / 1000)
        const t = Math.min(1, age / life)
        const pulse = t < 0.18 ? t / 0.18 : Math.max(0, 1 - (t - 0.18) / 0.82)
        glow.scale.setScalar((2.6 + t * 3.6) * FIGHTER_PRESENCE)
        glow.material.opacity = pulse * 0.85
        flash.scale.setScalar((1.5 + Math.sin(age * 20) * 0.25 + t * 1.1) * FIGHTER_PRESENCE)
        flash.material.opacity = pulse * 0.95
        flash.material.rotation = age * 2.1 * face
        ring.scale.setScalar((1.6 + t * 3.8) * FIGHTER_PRESENCE)
        ring.material.opacity = pulse * 0.7
        ring.material.rotation = -age * 1.6 * face
        core.scale.setScalar((1.1 + t * 1.8) * FIGHTER_PRESENCE)
        core.material.opacity = pulse * 0.8
        core.material.rotation = age * 3
        for (const spark of sparks) {
          const a = spark.angle + age * spark.spin
          const radius = (0.45 + t * 2.0) * FIGHTER_PRESENCE
          spark.node.position.set(Math.cos(a) * radius * face, Math.sin(a) * radius * 0.55 + age * spark.rise, 0.05)
          spark.node.scale.setScalar((0.2 + (1 - t) * 0.35) * FIGHTER_PRESENCE)
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
