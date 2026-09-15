import { computed, ref } from 'vue'
import { sfx } from '../game/audio/game-audio'

export function useAudioSettings() {
  const state = sfx.mix()
  const volume = ref(Math.round(state.volume * 100))
  const muted = ref(state.muted)
  const label = computed(() => muted.value ? 'MUTED' : `${volume.value}%`)

  function setVolume(value: number) {
    volume.value = value
    muted.value = value === 0
    sfx.setVolume(value / 100)
    sfx.setMuted(muted.value)
  }

  function toggleMuted() {
    muted.value = !muted.value
    sfx.setMuted(muted.value)
    if (!muted.value) sfx.click()
  }

  return { volume, muted, label, setVolume, toggleMuted }
}
