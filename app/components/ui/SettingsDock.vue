<script setup lang="ts">
import { sfx } from '../../game/audio/game-audio'

const open = ref(false)
const dock = useTemplateRef<HTMLElement>('dock')
const audio = useAudioSettings()
const route = useRoute()
const onSelect = computed(() => route.path === '/select')
const onHome = computed(() => route.path === '/')

function closeOutside(event: PointerEvent) {
  if (dock.value && !dock.value.contains(event.target as Node)) open.value = false
}

function closeEscape(event: KeyboardEvent) {
  if (event.code === 'Escape') open.value = false
}

onMounted(() => {
  sfx.arm()
  document.addEventListener('pointerdown', closeOutside)
  document.addEventListener('keydown', closeEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', closeOutside)
  document.removeEventListener('keydown', closeEscape)
})
</script>

<template>
  <div
    ref="dock"
    class="fixed right-4 z-70 font-ui"
    :class="onSelect ? 'bottom-4' : onHome ? 'top-14' : 'top-4'"
  >
    <button
      class="settings-btn grid place-items-center transition duration-200"
      :class="[
        onSelect
          ? 'size-7 rounded-md border border-[#8ea0b6aa] bg-[#121820ee]'
          : 'size-11 rounded-full border border-[#9eb0c488]',
        open ? 'settings-btn--open' : '',
      ]"
      type="button"
      aria-label="Settings"
      :aria-expanded="open"
      @click="open = !open; sfx.click()"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        class="settings-gear fill-current"
        :class="onSelect ? 'size-3.5' : 'size-[18px]'"
      >
        <path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.15 7.15 0 0 0-1.63-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84a.48.48 0 0 0-.48.41l-.36 2.54c-.58.23-1.12.54-1.63.94l-2.39-.96a.49.49 0 0 0-.59.22L2.77 8.87a.48.48 0 0 0 .12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.3.59.22l2.39-.96c.5.4 1.05.71 1.63.94l.36 2.54c.05.24.25.41.48.41h3.84c.23 0 .43-.17.48-.41l.36-2.54c.58-.23 1.12-.54 1.63-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.03-1.58ZM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2Z" />
      </svg>
    </button>
    <div
      v-if="open"
      class="sleet-panel absolute right-0 grid w-[min(280px,calc(100vw-32px))] gap-3 p-4"
      :class="onSelect ? 'bottom-9' : 'top-13'"
    >
      <p class="m-0 text-[10px] font-bold uppercase tracking-[2px] text-sleet-gold">Steel Fight Lab</p>
      <h2 class="m-0 font-display text-2xl">Volume</h2>
      <label class="grid grid-cols-[1fr_auto] gap-2 text-[11px] text-[#b8c6d4]">
        <span>Music, voices, and effects</span><strong>{{ audio.label.value }}</strong>
        <input
          :value="audio.volume.value"
          class="col-span-2 w-full accent-[#4b92f8]"
          type="range"
          min="0"
          max="100"
          step="1"
          aria-label="Game volume"
          @input="audio.setVolume(Number(($event.target as HTMLInputElement).value))"
        >
      </label>
      <button class="sleet-button justify-self-start px-4" type="button" :aria-pressed="audio.muted.value" @click="audio.toggleMuted">
        {{ audio.muted.value ? 'Unmute' : 'Mute' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.settings-btn {
  color: #d7e6ff;
  background:
    radial-gradient(circle at 32% 28%, #3a5168, #141c28 72%);
  box-shadow:
    0 10px 22px rgb(0 0 0 / 45%),
    inset 0 1px rgb(255 255 255 / 14%),
    inset 0 -1px rgb(0 0 0 / 35%);
}

.settings-btn:hover {
  color: #fff;
  border-color: #d2ac5d;
  filter: brightness(1.08);
}

.settings-btn:hover .settings-gear {
  transform: rotate(45deg);
}

.settings-btn--open {
  color: #fff1bd;
  border-color: #d2ac5d;
  background:
    radial-gradient(circle at 32% 28%, #6a5530, #241a10 72%);
  box-shadow:
    0 10px 22px rgb(0 0 0 / 45%),
    0 0 18px rgb(210 172 93 / 22%),
    inset 0 1px rgb(255 255 255 / 14%);
}

.settings-btn--open .settings-gear {
  transform: rotate(90deg);
}

.settings-gear {
  transition: transform 280ms cubic-bezier(.2, .8, .2, 1);
}
</style>
