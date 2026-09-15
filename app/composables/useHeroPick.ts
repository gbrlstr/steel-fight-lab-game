import { ref } from 'vue'
import { initial } from '../game/shared/combat'

const KEY = 'sleet-pick'
const p1 = ref('tusk')
const p2 = ref('tusk')
let loaded = false

export function useHeroPick() {
  function load() {
    if (loaded || !import.meta.client) return
    loaded = true
    try {
      const saved = JSON.parse(sessionStorage.getItem(KEY) || '')
      if (saved.p1) p1.value = saved.p1
      if (saved.p2) p2.value = saved.p2
    } catch {
      // Keep safe defaults.
    }
  }

  function save(hero: string, rival = p2.value) {
    p1.value = hero
    p2.value = rival
    sessionStorage.setItem(KEY, JSON.stringify({ p1: hero, p2: rival }))
  }

  load()
  return {
    p1,
    p2,
    save,
    state: () => initial(p1.value, p2.value),
  }
}
