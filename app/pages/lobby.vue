<script setup lang="ts">
import { sfx } from '../game/audio/game-audio'

const lobby = useLobbyStore()
const pick = useHeroPick()
const route = useRoute()
const background = new URL('../assets/menu/sleetfighter_select_bg.png', import.meta.url).href
const logo = new URL('../assets/menu/steelfightlab_logo.png', import.meta.url).href
const invite = computed(() => String(route.query.room ?? '').toUpperCase())
const connectForm = ref<{ focusPanel: () => void } | null>(null)
const onlinePanel = ref<HTMLElement | null>(null)

useHead({ title: 'Lobby · Steel Fight Lab' })

watch(() => lobby.lastEvent, event => {
  if ((event === 'start' || event === 'resumed') && lobby.match) void navigateTo('/fight')
})

onMounted(() => {
  sfx.menu()
  void lobby.refreshRooms()
  if (lobby.match) void navigateTo('/fight')
})

async function localFight() {
  lobby.exit()
  lobby.setMode('local')
  sfx.click()
  await navigateTo('/select')
}

function focusOnline() {
  lobby.setMode('online')
  sfx.click()
  onlinePanel.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  connectForm.value?.focusPanel()
}

async function chooseOnlineHero() {
  lobby.setMode('online')
  sfx.click()
  await navigateTo('/select')
}

async function back() {
  lobby.exit()
  sfx.back()
  await navigateTo('/')
}
</script>

<template>
  <main class="relative h-full overflow-auto bg-sleet-ink font-display">
    <img :src="background" alt="" class="fixed inset-0 h-full w-full object-cover opacity-60">
    <div class="fixed inset-0 bg-[linear-gradient(90deg,#02060cee_0%,#08101bb8_45%,#03070dcc_100%)]" />
    <header class="relative z-10 flex h-20 items-center justify-between border-b border-white/10 px-[clamp(16px,4vw,64px)]">
      <button type="button" class="font-ui text-xs font-bold tracking-[.12em] text-white" @click="back">‹ BACK</button>
      <img :src="logo" alt="Steel Fight Lab" class="h-16 max-w-[42vw] object-contain">
      <div class="flex items-center gap-2 font-ui text-[9px] tracking-[.15em] text-sleet-ice"><i class="size-2 rounded-full bg-[#62df8a]" /> FIGHT LOBBY</div>
    </header>
    <div class="relative z-10 mx-auto grid min-h-[calc(100%-5rem)] max-w-[1280px] grid-cols-[minmax(280px,.85fr)_minmax(360px,1.15fr)] items-center gap-[clamp(24px,5vw,80px)] px-[clamp(18px,5vw,70px)] py-8 max-lg:grid-cols-1">
      <section>
        <p class="font-ui text-[9px] font-bold tracking-[.2em] text-sleet-gold">CROWNFALL · STEEL FIGHT LAB</p>
        <h1 class="my-4 text-[clamp(38px,6vw,76px)] font-black leading-[.86] text-white [text-shadow:0_6px_18px_#000]">CHOOSE HOW<br>YOU FIGHT</h1>
        <p class="mb-6 max-w-xl font-ui text-xs leading-6 text-[#bdc8d2]">Challenge the computer or gather fighters in an online room.</p>
        <div class="grid gap-3">
          <LobbyModeCard number="01" eyebrow="VS CPU" title="LOCAL FIGHT" description="Pick a fighter and battle the computer" interactive @select="localFight" />
          <LobbyModeCard number="02" eyebrow="MULTIPLAYER" title="ONLINE ROOM" description="Create a room or join with an invite" interactive @select="focusOnline" />
        </div>
      </section>
      <section ref="onlinePanel" class="sleet-panel min-h-[460px] p-[clamp(18px,3vw,36px)]" aria-live="polite">
        <div class="mb-6 flex items-start justify-between border-b border-white/10 pb-4">
          <div>
            <span class="font-ui text-[8px] font-bold tracking-[.2em] text-sleet-gold">MULTIPLAYER</span>
            <h2 class="mt-1 text-2xl text-white">{{ lobby.room ? 'Fighters assembled' : "Fighters' room" }}</h2>
          </div>
          <span v-if="lobby.room" class="border border-sleet-gold/60 px-3 py-2 font-ui text-[10px] text-sleet-gold">ROOM {{ lobby.room.code }}</span>
        </div>
        <LobbyRoomPanel
          v-if="lobby.room"
          :room="lobby.room"
          :own-id="lobby.ownId"
          :hero="pick.p1.value"
          @command="lobby.send"
          @change-hero="chooseOnlineHero"
          @leave="lobby.exit"
        />
        <LobbyRoomConnectForm
          v-else
          ref="connectForm"
          :busy="lobby.connecting"
          :invite="invite"
          :rooms="lobby.openRooms"
          :rooms-error="lobby.roomsError"
          @connect="lobby.connect"
          @refresh="lobby.refreshRooms"
        />
        <p class="mt-5 border-t border-white/10 pt-4 font-ui text-[10px] text-[#9fb0bd]">
          {{ lobby.status || (lobby.room ? 'Waiting for more fighters.' : 'Choose an option to begin.') }}
        </p>
      </section>
    </div>
  </main>
</template>
