import * as T from 'three'
import { FIGHTER_PRESENCE } from './fighters'

export type QuillBurst = { root: T.Object3D; update: (time: number) => boolean; dispose: () => void }

/** Bristleback Quill Spray (2nd special) — radial spine burst around the caster. */
export function bristlebackQuillFx() {
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
  const spray = Array.from({ length: 24 }, (_, i) => load(`/effects/bristleback/spray1_seq0_${i}.png`))
  const glowMap = () => load('/effects/bristleback/particle_glow_04.png')

  function create(at: { x: number; y: number; z: number }, face: number, born: number, strength = 1): QuillBurst {
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

    const halo = sprite(glowMap(), 0x7ab82e, 2.2 * strength)
    const ring = sprite(glowMap(), 0xc6e04a, 1.6 * strength)
    const quills = Array.from({ length: 16 }, (_, i) => {
      const node = sprite(spray[0]!, i % 2 ? 0xb8d44a : 0x8fbf2a, 0.45)
      return { node, angle: (i / 16) * Math.PI * 2, spin: 0.8 + (i % 3) * 0.2, dist: 0.5 + (i % 4) * 0.12 }
    })

    const life = 0.55
    return {
      root,
      update(time) {
        const age = Math.max(0, (time - born) / 1000)
        const t = Math.min(1, age / life)
        const pulse = t < 0.15 ? t / 0.15 : Math.max(0, 1 - (t - 0.15) / 0.85)
        const frame = Math.min(23, Math.floor(t * 24))
        halo.scale.setScalar((2.0 + t * 2.4) * FIGHTER_PRESENCE * strength)
        halo.material.opacity = pulse * 0.55
        ring.scale.setScalar((1.4 + t * 2.8) * FIGHTER_PRESENCE * strength)
        ring.material.opacity = pulse * 0.7
        ring.material.rotation = age * 2.4 * face
        for (const quill of quills) {
          const a = quill.angle + age * quill.spin
          const radius = (quill.dist + t * 1.5) * FIGHTER_PRESENCE * strength
          quill.node.material.map = spray[frame]!
          quill.node.position.set(Math.cos(a) * radius, Math.sin(a) * radius * 0.65 + 0.15, 0.04)
          quill.node.scale.setScalar((0.28 + (1 - t) * 0.35) * FIGHTER_PRESENCE)
          quill.node.material.opacity = pulse * 0.9
          quill.node.material.rotation = a + Math.PI / 2
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
