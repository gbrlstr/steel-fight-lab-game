import { ref } from 'vue'
import { initial } from '../game/shared/combat'
import { resolveSkin } from '../game/render/fighters'

const KEY = 'sleet-pick'
const p1 = ref('tusk')
const p2 = ref('tusk')
const skins = ref<Record<string, string>>({})
let loaded = false

export function useHeroPick() {
  function persist() {
    sessionStorage.setItem(KEY, JSON.stringify({ p1: p1.value, p2: p2.value, skins: skins.value }))
  }

  function load() {
    if (loaded || !import.meta.client) return
    loaded = true
    try {
      const saved = JSON.parse(sessionStorage.getItem(KEY) || '')
      if (saved.p1) p1.value = saved.p1
      if (saved.p2) p2.value = saved.p2
      if (saved.skins && typeof saved.skins === 'object') skins.value = saved.skins
    } catch {
      // Keep safe defaults.
    }
  }

  function save(hero: string, rival = p2.value) {
    p1.value = hero
    p2.value = rival
    persist()
  }

  function skinOf(hero: string) {
    return resolveSkin(hero, skins.value[hero] || 'default')
  }

  function setSkin(hero: string, skin: string) {
    skins.value = { ...skins.value, [hero]: resolveSkin(hero, skin) }
    persist()
  }

  load()
  return {
    p1,
    p2,
    skins,
    skinOf,
    setSkin,
    save,
    state: () => initial(p1.value, p2.value),
  }
}
