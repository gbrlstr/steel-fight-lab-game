<script setup lang="ts">
import { sfx } from '../../game/audio/game-audio'

const props = withDefaults(defineProps<{ to?: string; label?: string }>(), {
  to: '/',
  label: 'BACK',
})

async function back() {
  sfx.back()
  await navigateTo(props.to)
}
</script>

<template>
  <button
    type="button"
    class="flex items-center gap-2 border-0 bg-transparent font-ui text-xs font-bold tracking-[.12em] text-[#dce6ef] hover:text-white"
    @click="back"
  >
    <span aria-hidden="true" class="text-lg">‹</span>{{ label }}
  </button>
</template>
