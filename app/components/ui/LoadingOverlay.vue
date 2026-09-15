<script setup lang="ts">
const props = withDefaults(defineProps<{
  label: string
  progress: number
  initial?: boolean
}>(), {
  initial: false,
})

const art = new URL('../../assets/menu/steelfightlab_titlescreen_art.png', import.meta.url).href
const selectArt = new URL('../../assets/menu/sleetfighter_select_bg.png', import.meta.url).href
const percent = computed(() => Math.round(Math.min(1, Math.max(0, props.progress)) * 100))
</script>

<template>
  <div class="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-sleet-ink font-display text-sleet-text">
    <img
      :src="initial ? art : selectArt"
      alt=""
      class="absolute inset-0 h-full w-full object-cover object-left opacity-45"
    >
    <div class="relative w-[min(26rem,86vw)] text-center">
      <p class="mb-3 text-xs font-bold tracking-[.32em] text-sleet-gold">STEEL FIGHT LAB</p>
      <div class="h-2 overflow-hidden border border-[#8a6a32] bg-[#1a140c]">
        <div
          class="h-full bg-gradient-to-b from-sleet-gold-light to-[#b8862e] transition-[width] duration-150"
          :style="{ width: `${percent}%` }"
        />
      </div>
      <p class="mt-3 font-bold tracking-[.14em]">{{ label }}</p>
      <p class="mt-2 text-xs tracking-[.14em] text-[#cbb88a]">{{ percent }}%</p>
      <p class="mt-4 font-ui text-[8px] leading-3.5 tracking-[.04em] text-[#7a8896]">
        Models &amp; art © Valve / Dota 2 · Unofficial fan project
      </p>
    </div>
  </div>
</template>
