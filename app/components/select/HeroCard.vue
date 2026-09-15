<script setup lang="ts">
defineProps<{ hero: string; name: string; selected: boolean; ready?: boolean }>()
defineEmits<{ select: [hero: string] }>()
</script>

<template>
  <button
    type="button"
    class="hero-card"
    :class="{ selected, ready }"
    :data-hero="hero"
    :aria-label="name"
    :aria-pressed="selected"
    @click="$emit('select', hero)"
  >
    <span class="selection-rune" aria-hidden="true"><i /></span>
  </button>
</template>

<style scoped>
.hero-card {
  position: relative;
  width: clamp(64px, 8.9vw, 94px);
  aspect-ratio: .63;
  padding: 0;
  overflow: visible;
  border: 1px solid #080b0e;
  background: #13171a;
  box-shadow: 0 0 0 1px #7b818444, 0 7px 18px #000b;
  cursor: pointer;
  transition: transform 130ms ease, filter 130ms ease;
}

.hero-card::before {
  content: "";
  position: absolute;
  inset: -2px;
  z-index: 2;
  border: 1px solid #9ca0a188;
  pointer-events: none;
}

.hero-card::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(90deg, #0006, transparent 22%, transparent 78%, #0007);
  pointer-events: none;
}

/* Pronto ou selecionado: só a moldura — o preview 3D fica no canvas atrás */
.hero-card.ready,
.hero-card.selected {
  border-color: transparent;
  background: transparent;
  box-shadow: none;
}

.hero-card.ready::after,
.hero-card.selected::after {
  content: none;
}

.hero-card:not(.ready):not(.selected)::after {
  background:
    radial-gradient(circle at 50% 42%, #53606a55 0 10%, transparent 11%),
    linear-gradient(110deg, #10161c 25%, #26313a 45%, #10161c 65%);
  background-size: 100% 100%, 220% 100%;
  animation: card-loading 1.2s linear infinite;
}

.hero-card:hover {
  z-index: 3;
  transform: translateY(-3px);
  filter: brightness(1.1);
}

.hero-card.selected {
  z-index: 4;
}

.hero-card.selected::before {
  inset: -3px;
  border: 2px solid #d13a2d;
  box-shadow: inset 0 0 0 1px #ffb55a66, 0 0 9px #e1372355;
}

.selection-rune {
  position: absolute;
  left: 50%;
  bottom: -18px;
  z-index: 5;
  display: none;
  width: 27px;
  height: 27px;
  transform: translateX(-50%) rotate(45deg);
  border: 2px solid #c63d27;
  background: #170706;
  box-shadow: 0 0 0 2px #43120d, inset 0 0 8px #000;
}

.selection-rune i {
  position: absolute;
  inset: 7px;
  border-radius: 50%;
  background: #ee8c31;
  box-shadow: 0 0 0 2px #721c10, 0 0 8px #ff6a16;
}

.hero-card.selected .selection-rune {
  display: block;
}

@keyframes card-loading {
  to { background-position: 0 0, -220% 0; }
}
</style>
