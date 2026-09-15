<script setup lang="ts">
import type { LobbyRoom } from '../../game/net/lobby-session'
import { roster } from '../../game/shared/combat'
import { portrait } from '../../game/shared/assets'

const props = defineProps<{ room: LobbyRoom; ownId: string; hero: string }>()
const emit = defineEmits<{
  command: [type: string]
  changeHero: []
  leave: []
}>()
const me = computed(() => props.room.people.find(person => person.id === props.ownId))
const picked = computed(() => me.value?.hero || props.hero)
const isHost = computed(() => props.room.host === props.ownId)
</script>

<template>
  <div class="grid gap-4">
    <div class="grid grid-cols-[48px_1fr_auto] items-center gap-3 border border-[#73859666] bg-[#07111bcc] p-2">
      <img :src="portrait(picked)" alt="" class="size-12 object-cover">
      <span class="grid">
        <small class="font-ui text-[8px] tracking-[.14em] text-[#96a6b5]">YOUR FIGHTER</small>
        <b class="font-display text-lg text-white">{{ roster[picked]?.name ?? picked }}</b>
      </span>
      <UiSleetButton @click="emit('changeHero')">CHANGE</UiSleetButton>
    </div>
    <LobbyPlayerList :room="room" :own-id="ownId" />
    <div class="grid grid-cols-2 gap-2">
      <UiSleetButton gold :disabled="room.queue.includes(ownId) || room.pair.includes(ownId)" @click="emit('command', 'queue')">JOIN QUEUE</UiSleetButton>
      <UiSleetButton :disabled="!room.pair.includes(ownId) || !!me?.ready" @click="emit('command', 'ready')">I'M READY</UiSleetButton>
      <UiSleetButton v-if="isHost" @click="emit('command', 'call')">CALL UP</UiSleetButton>
      <UiSleetButton v-if="isHost" @click="emit('command', 'tournament')">START BRACKET</UiSleetButton>
    </div>
    <LobbyBracketList :room="room" />
    <button type="button" class="justify-self-start font-ui text-[9px] font-bold tracking-[.1em] text-[#df7777] hover:text-[#ff9d9d]" @click="emit('leave')">
      LEAVE ROOM
    </button>
  </div>
</template>
