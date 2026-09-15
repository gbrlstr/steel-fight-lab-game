import { readonly, ref } from 'vue'
import { preloadMatch, type BootProgress } from '../game/render/preload'

const ready = ref(false)
const progress = ref(0)
const label = ref('Loading fighters')
let bootPromise: Promise<void> | null = null

export function useGamePreload() {
  function update(value: BootProgress) {
    progress.value = value.ratio
    label.value = value.label
  }

  function start() {
    if (!bootPromise) {
      bootPromise = preloadMatch(update)
        .catch(error => console.warn('Partial preload:', error))
        .then(() => {
          progress.value = 1
          label.value = 'Ready'
          ready.value = true
        })
    }
    return bootPromise
  }

  return {
    ready: readonly(ready),
    progress: readonly(progress),
    label: readonly(label),
    start,
  }
}
