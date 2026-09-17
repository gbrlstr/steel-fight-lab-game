<script setup lang="ts">
import { RULES } from '../../game/shared/combat'
import { portrait } from '../../game/shared/assets'

defineProps<{ index: number; side: 'left' | 'right' }>()
</script>

<template>
  <div class="fighter-hud" :class="side">
    <div class="portrait-stack">
      <img :id="`portrait${index}`" class="hero-portrait" :src="portrait('tusk')" alt="Tusk">
      <div class="guard-row">
        <span :id="`shield${index}`" class="shields">
          <img class="shield" src="/ui/shield_icon_png.png" alt="Guard">
          <img class="shield broken" src="/ui/shield_icon_broken_png.png" alt="">
        </span>
        <progress :id="`guard${index}`" max="100" value="100" />
      </div>
    </div>
    <div class="health-stack">
      <div :id="`hp${index}`" class="hp" role="meter" aria-valuemin="0" :aria-valuemax="RULES.health" aria-valuenow="2000"><span /></div>
      <div class="name-row">
        <b :id="`name${index}`">TUSK</b>
        <span :id="`round${index}`" class="pips">
          <img v-for="n in RULES.wins" :key="n" class="pip" src="/ui/win_icon_png.png" alt="">
        </span>
      </div>
    </div>
  </div>
</template>
