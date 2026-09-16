<script setup lang="ts">
import { roster } from '../game/shared/combat'
import { prepareMatchEntry } from '../game/render/preload'
import { sfx } from '../game/audio/game-audio'

const pick = useHeroPick()
const lobby = useLobbyStore()
const selected = ref(pick.p1.value)
const loading = ref(false)
const progress = ref(0)
const label = ref('Preparing the fight')
const modelsReady = ref(false)
const readyHeroes = ref(new Set<string>())
const art = new URL('../assets/menu/sleetfighter_select_arena_bg.png', import.meta.url).href

useHead({ title: 'Choose fighter · Steel Fight Lab' })
onMounted(() => sfx.menu())

function markReady(hero: string) {
  const next = new Set(readyHeroes.value)
  next.add(hero)
  readyHeroes.value = next
}

function choose(hero: string) {
  if (hero !== selected.value) sfx.selectHero()
  selected.value = hero
}

function chooseSkin(skin: string) {
  if (skin === pick.skinOf(selected.value)) return
  sfx.selectHero()
  pick.setSkin(selected.value, skin)
}

async function back() {
  if (loading.value) return
  sfx.back()
  await navigateTo('/lobby')
}

async function confirm() {
  if (loading.value) return
  const rival = pick.p2.value || 'tusk'
  pick.save(selected.value, rival)
  sfx.confirm()
  if (lobby.mode === 'online' && lobby.connection()) {
    lobby.selectHero(selected.value)
    await navigateTo('/lobby')
    return
  }
  loading.value = true
  const started = performance.now()
  await prepareMatchEntry([
    { id: selected.value, skin: pick.skinOf(selected.value) },
    { id: rival, skin: pick.skinOf(rival) },
  ], update => {
    progress.value = update.ratio
    label.value = update.label
  }).catch(error => console.warn('Partial fight preparation:', error))
  const hold = 900 - (performance.now() - started)
  if (hold > 0) await new Promise(resolve => window.setTimeout(resolve, hold))
  progress.value = 1
  label.value = 'Ready'
  await navigateTo('/fight')
}
</script>

<template>
  <main class="pick-page relative h-full overflow-hidden bg-sleet-ink">
    <img :src="art" alt="" class="select-backdrop">
    <div class="select-atmosphere" />
    <div class="select-grain" />
    <SelectHeroPreviewCanvas :hero="selected" :skin="pick.skinOf(selected)" @loaded="modelsReady = true" @ready="markReady" />
    <SelectHeroPicker :selected="selected" :skin="pick.skinOf(selected)" :busy="loading" :ready="readyHeroes" @select="choose" @skin="chooseSkin" @confirm="confirm" @back="back" />
    <p v-if="!modelsReady" class="absolute bottom-4 left-4 z-20 font-ui text-[9px] tracking-[.15em] text-sleet-gold">LOADING FIGHTERS…</p>
    <UiLoadingOverlay v-if="loading" :label="`${roster[selected].name} · ${label}`" :progress="progress" />
  </main>
</template>

<style scoped>
.select-backdrop {
  position: absolute;
  inset: -12px;
  width: calc(100% + 24px);
  height: calc(100% + 24px);
  object-fit: cover;
  object-position: left center;
  filter: blur(3px) saturate(.72) brightness(.72);
  transform: scale(1.025);
}

.select-atmosphere {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 49% 42%, transparent 0 20%, #090b1190 58%, #030407df 100%),
    linear-gradient(90deg, #07090d2e 0%, #10131b47 42%, #070910a8 78%, #030408e5 100%),
    linear-gradient(0deg, #030509b8 0%, transparent 36%, #0203075e 100%);
}

.select-grain {
  position: absolute;
  inset: 0;
  opacity: .09;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 140 140' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.78' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E");
  mix-blend-mode: soft-light;
  pointer-events: none;
}
</style>
