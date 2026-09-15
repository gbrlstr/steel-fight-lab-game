<script setup lang="ts">
import { roster, RULES } from '../game/shared/combat'

const lobby = useLobbyStore()
const pick = useHeroPick()
const route = useRoute()

if (lobby.mode === 'online' && !lobby.match) {
  lobby.tryResume()
  await navigateTo('/lobby')
}

const state = lobby.match ?? pick.state()
const scenario = String(route.query.visual ?? '')
if (!lobby.match && scenario) {
  const wall = RULES.edge - roster.tusk.m_flHeroWidth / 2
  if (scenario === 'left') {
    state.fighters[0].x = -wall
    state.fighters[1].x = 600
  } else if (scenario === 'right') {
    state.fighters[0].x = 600
    state.fighters[1].x = wall
  } else if (scenario === 'opposite') {
    state.fighters[0].x = -wall
    state.fighters[1].x = wall
  }
}
useHead({ title: 'Fight · Steel Fight Lab' })

watch(() => lobby.lastEvent, event => {
  if (event === 'result') return
  if ((event === 'start' || event === 'resumed') && lobby.match && route.path !== '/fight') {
    void navigateTo('/fight')
  }
})
</script>

<template>
  <div class="fight-app">
    <main class="fight-layout">
      <section class="ring">
        <FightCanvas :state="state" />
        <FightScoreboard />
        <FightVersusAlert
          :left="roster[state.fighters[0].hero].name.toUpperCase()"
          :right="roster[state.fighters[1].hero].name.toUpperCase()"
        />
        <FightRoundAlert />
        <FightVictoryAlert />
        <div id="announcement">LOADING THE TAVERN</div>
        <div id="combo0" class="combat-combo" />
        <div id="combo1" class="combat-combo right" />
        <FightToolbar />
        <div
          v-if="lobby.paused"
          class="pointer-events-none absolute inset-0 z-30 grid place-items-center bg-[#02060ccc]"
        >
          <div class="sleet-panel max-w-md px-8 py-6 text-center">
            <p class="font-ui text-[9px] font-bold tracking-[.2em] text-sleet-gold">RECONNECT</p>
            <h2 class="mt-2 font-display text-3xl text-white">MATCH PAUSED</h2>
            <p class="mt-3 font-ui text-xs leading-5 text-[#bdc8d2]">
              {{ lobby.pauseMessage || 'Waiting for opponent to reconnect…' }}
            </p>
            <p class="mt-2 font-ui text-[10px] text-[#91a1b0]">
              If no one returns in 30s, victory goes to whoever stayed.
            </p>
          </div>
        </div>
        <div class="ring-footer"><span id="status">Loading models and textures…</span></div>
      </section>
    </main>
    <FightMoveListDialog />
  </div>
</template>
