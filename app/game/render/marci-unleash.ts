import * as T from 'three'
import { FIGHTER_PRESENCE } from './fighters'

export type UnleashBurst = { root: T.Object3D; update: (time: number) => boolean; dispose: () => void }
export type UnleashAura = { root: T.Object3D; update: (x: number, y: number, z: number, time: number) => void; dispose: () => void }

/** Marci Unleash (2nd special) — cast burst + persistent buff aura. */
export function marciUnleashFx() {
  const loader = new T.TextureLoader()
  const maps = new Map<string, T.Texture>()
  const tex = (path: string) => {
    let map = maps.get(path)
    if (!map) {
      map = loader.load(path)
      map.colorSpace = T.SRGBColorSpace
      maps.set(path, map)
    }
    return map
  }
  const hit = (name: string) => tex(`/effects/hit/${name}.png`)

  function createCast(at: { x: number; y: number; z: number }, face: number, born: number): UnleashBurst {
    const root = new T.Group()
    root.position.set(at.x, at.y, at.z)
    const mats: T.SpriteMaterial[] = []
    const sprite = (name: string, color: number, size: number) => {
      const material = new T.SpriteMaterial({
        map: hit(name),
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

    const glow = sprite('particle_glow_08', 0xff6a2a, 2.6)
    const flash = sprite('particle_flare_006_white', 0xffe0a8, 1.8)
    const ring = sprite('particle_heroring_bad', 0xff8f3d, 2.0)
    const sparks = Array.from({ length: 12 }, (_, i) => {
      const node = sprite(i % 2 ? 'particle_glow_01' : 'fleks5_seq26', i % 3 ? 0xffb14a : 0xff5a28, 0.32)
      return { node, angle: (i / 12) * Math.PI * 2, spin: 1.4 + (i % 4) * 0.25, rise: 0.35 + (i % 3) * 0.15 }
    })

    const life = 0.85
    return {
      root,
      update(time) {
        const age = Math.max(0, (time - born) / 1000)
        const t = Math.min(1, age / life)
        const pulse = t < 0.2 ? t / 0.2 : Math.max(0, 1 - (t - 0.2) / 0.8)
        glow.scale.setScalar((2.4 + t * 3.2) * FIGHTER_PRESENCE)
        glow.material.opacity = pulse * 0.8
        flash.scale.setScalar((1.3 + Math.sin(age * 22) * 0.2 + t) * FIGHTER_PRESENCE)
        flash.material.opacity = pulse * 0.95
        flash.material.rotation = age * 2.4 * face
        ring.scale.setScalar((1.5 + t * 3.4) * FIGHTER_PRESENCE)
        ring.material.opacity = pulse * 0.75
        ring.material.rotation = -age * 1.8 * face
        for (const spark of sparks) {
          const a = spark.angle + age * spark.spin
          const radius = (0.4 + t * 1.8) * FIGHTER_PRESENCE
          spark.node.position.set(Math.cos(a) * radius * face, Math.sin(a) * radius * 0.6 + age * spark.rise, 0.05)
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

  function createAura(): UnleashAura {
    const root = new T.Group()
    const mats: T.SpriteMaterial[] = []
    const sprite = (name: string, color: number, size: number) => {
      const material = new T.SpriteMaterial({
        map: hit(name),
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
      node.renderOrder = 18
      node.frustumCulled = false
      root.add(node)
      return node
    }
    const halo = sprite('particle_glow_08', 0xff7a35, 2.2)
    const core = sprite('particle_flare_004b_mod', 0xffd090, 1.1)
    const orbit = Array.from({ length: 6 }, (_, i) => {
      const node = sprite('particle_glow_01', 0xffa05a, 0.28)
      return { node, phase: (i / 6) * Math.PI * 2 }
    })

    return {
      root,
      update(x, y, z, time) {
        root.position.set(x, y, z)
        const t = time / 1000
        halo.material.opacity = 0.28 + Math.sin(t * 4) * 0.08
        halo.scale.setScalar((2.0 + Math.sin(t * 3) * 0.15) * FIGHTER_PRESENCE)
        core.material.opacity = 0.45 + Math.sin(t * 6) * 0.1
        core.material.rotation = t * 1.5
        core.scale.setScalar((1.0 + Math.sin(t * 5) * 0.12) * FIGHTER_PRESENCE)
        for (const spark of orbit) {
          const a = spark.phase + t * 2.4
          spark.node.position.set(Math.cos(a) * 0.7 * FIGHTER_PRESENCE, Math.sin(a * 1.3) * 0.45 * FIGHTER_PRESENCE + 0.2, 0.03)
          spark.node.material.opacity = 0.55
          spark.node.scale.setScalar(0.22 * FIGHTER_PRESENCE)
        }
      },
      dispose() {
        for (const material of mats) material.dispose()
      },
    }
  }

  return {
    createCast,
    createAura,
    dispose() {
      for (const map of maps.values()) map.dispose()
      maps.clear()
    },
  }
}
