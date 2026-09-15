<script setup lang="ts">
import { roster } from '../../game/shared/combat'

const props = defineProps<{ selected: string; busy: boolean; ready?: ReadonlySet<string> | Set<string> }>()
const emit = defineEmits<{ select: [hero: string]; confirm: []; back: [] }>()
const heroes = ['tusk', 'bristleback', 'vengeful', 'dawnbreaker', 'marci']
const logo = new URL('../../assets/menu/steelfightlab_logo.png', import.meta.url).href
const fill = new URL('../../assets/menu/button_primary_bg.png', import.meta.url).href
const outline = new URL('../../assets/menu/button_primary_outline.png', import.meta.url).href
const arrow = new URL('../../assets/fight/arrow_left.svg', import.meta.url).href

function keydown(event: KeyboardEvent) {
  const index = heroes.indexOf(props.selected)
  if (event.code === 'ArrowRight' || event.code === 'ArrowDown' || event.code === 'KeyD') {
    event.preventDefault()
    emit('select', heroes[(index + 1) % heroes.length])
  } else if (event.code === 'ArrowLeft' || event.code === 'ArrowUp' || event.code === 'KeyA') {
    event.preventDefault()
    emit('select', heroes[(index + heroes.length - 1) % heroes.length])
  } else if (event.code === 'Enter' || event.code === 'Space') {
    event.preventDefault()
    emit('confirm')
  } else if (event.code === 'Escape') {
    emit('back')
  }
}

onMounted(() => window.addEventListener('keydown', keydown))
onBeforeUnmount(() => window.removeEventListener('keydown', keydown))
</script>

<template>
  <section class="picker-ui">
    <button class="close-picker" type="button" aria-label="Back to lobby" @click="emit('back')">×</button>
    <img :src="logo" alt="Steel Fight Lab" class="picker-logo">
    <header class="picker-heading">
      <h1>CHOOSE YOUR FIGHTER</h1>
      <span aria-hidden="true" />
    </header>
    <div class="hero-list">
      <SelectHeroCard
        v-for="hero in heroes"
        :key="hero"
        :hero="hero"
        :name="roster[hero].name"
        :selected="selected === hero"
        :ready="ready?.has(hero) ?? false"
        @select="emit('select', $event)"
      />
    </div>
    <div class="picker-actions">
      <button class="back-tile" type="button" aria-label="Back" @click="emit('back')">
        <img :src="arrow" alt="">
      </button>
      <button class="confirm-picker" type="button" :disabled="busy" @click="emit('confirm')">
        <img class="confirm-fill" :src="fill" alt="">
        <img class="confirm-outline" :src="outline" alt="">
        <span>{{ busy ? 'PREPARING…' : 'SELECT' }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.picker-ui {
  position: absolute;
  inset: 0;
  z-index: 10;
  font-family: Georgia, "Times New Roman", serif;
  pointer-events: none;
}

.picker-logo {
  position: absolute;
  top: 3.5%;
  left: 50%;
  width: clamp(125px, 17vw, 188px);
  transform: translateX(-50%);
  filter: drop-shadow(0 5px 7px #000b);
  animation: reveal-down 360ms ease-out both;
}

.picker-heading {
  position: absolute;
  top: 19%;
  left: 50%;
  width: min(680px, 88vw);
  transform: translateX(-50%);
  text-align: center;
  animation: reveal-down 400ms 50ms ease-out both;
}

.picker-heading h1 {
  margin: 0;
  color: #f4f0eb;
  font-size: clamp(22px, 3.25vw, 38px);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -.025em;
  text-shadow: 0 2px 1px #000, 0 5px 12px #000d;
}

.picker-heading span {
  position: relative;
  display: block;
  width: 106px;
  height: 20px;
  margin: 14px auto 0;
  border-top: 1px solid #7b6b6544;
}

.picker-heading span::before,
.picker-heading span::after {
  content: "";
  position: absolute;
  top: -1px;
  width: 43px;
  height: 18px;
  border-top: 1px solid #9b75635c;
}

.picker-heading span::before {
  left: -34px;
  transform: skewX(38deg);
}

.picker-heading span::after {
  right: -34px;
  transform: skewX(-38deg);
}

.hero-list {
  position: absolute;
  top: 39%;
  left: 50%;
  display: flex;
  align-items: stretch;
  justify-content: center;
  gap: clamp(5px, .75vw, 9px);
  width: min(570px, 80vw);
  transform: translateX(-50%);
  pointer-events: auto;
  animation: reveal-up 430ms 100ms ease-out both;
}

.picker-actions {
  position: absolute;
  top: 74%;
  left: 50%;
  display: flex;
  align-items: center;
  gap: clamp(12px, 2vw, 23px);
  transform: translateX(-50%);
  pointer-events: auto;
  animation: reveal-up 430ms 150ms ease-out both;
}

.back-tile {
  display: grid;
  width: 49px;
  height: 49px;
  padding: 0;
  place-items: center;
  border: 1px solid #6c737b88;
  background: linear-gradient(145deg, #26323cbb, #10171dcc);
  box-shadow: inset 0 1px #ffffff12, 0 6px 16px #000b;
  transform: rotate(45deg);
  cursor: pointer;
}

.back-tile img {
  width: 21px;
  transform: rotate(-45deg);
  filter: brightness(3) saturate(0);
}

.back-tile:hover {
  border-color: #d4b06b;
  filter: brightness(1.25);
}

.confirm-picker {
  position: relative;
  width: clamp(190px, 21vw, 226px);
  height: 67px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.confirm-picker img {
  position: absolute;
  inset: 50% auto auto 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%);
  object-fit: fill;
  pointer-events: none;
}

.confirm-fill {
  filter: sepia(1) saturate(7) hue-rotate(158deg) brightness(.78) contrast(1.25);
}

.confirm-outline {
  filter: saturate(.85) brightness(1.08);
}

.confirm-picker span {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: grid;
  place-items: center;
  transform: translateY(-1px);
  color: #fff;
  font-family: Verdana, Geneva, sans-serif;
  font-size: clamp(9px, .9vw, 11px);
  font-weight: 700;
  letter-spacing: .09em;
  text-shadow: 0 1px 2px #001633;
}

.confirm-picker:hover:not(:disabled) {
  filter: brightness(1.18);
}

.confirm-picker:active:not(:disabled) {
  transform: translateY(1px);
}

.confirm-picker:disabled {
  opacity: .6;
  cursor: wait;
}

.close-picker {
  position: absolute;
  z-index: 4;
  top: 4px;
  right: 10px;
  border: 0;
  background: transparent;
  color: #c4c7ca;
  font: 400 27px/1 Verdana, sans-serif;
  text-shadow: 0 1px 4px #000;
  pointer-events: auto;
  cursor: pointer;
}

.close-picker:hover {
  color: #fff;
}

@keyframes reveal-down {
  from { opacity: 0; transform: translate(-50%, -8px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}

@keyframes reveal-up {
  from { opacity: 0; transform: translate(-50%, 10px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}

@media (max-width: 700px), (max-aspect-ratio: 4/5) {
  .picker-logo { top: 4%; width: 130px; }
  .picker-heading { top: 17%; }
  .picker-heading h1 { font-size: clamp(18px, 6vw, 28px); }
  .hero-list { top: 56%; width: 96vw; gap: 4px; }
  .picker-actions { top: 79%; }
}

@media (max-height: 520px) {
  .picker-logo { top: 2%; width: 116px; }
  .picker-heading { top: 17%; }
  .picker-heading span { margin-top: 9px; }
  .hero-list { top: 38%; }
  .picker-actions { top: 75%; }
}
</style>
