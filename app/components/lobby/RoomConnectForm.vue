<script setup lang="ts">
import type { LobbyRoomSummary } from '../../game/net/lobby-session'

const props = defineProps<{
  busy: boolean
  invite?: string
  rooms?: LobbyRoomSummary[]
}>()
const emit = defineEmits<{
  connect: [type: 'create' | 'join', nick: string, code: string]
  refresh: []
}>()
const nick = ref('Viewer')
const code = ref(props.invite ?? '')
const panel = ref<HTMLElement | null>(null)

watch(() => props.invite, value => {
  if (value) code.value = value
})

function focusPanel() {
  panel.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  const nickInput = panel.value?.querySelector('input')
  nickInput?.focus()
}

defineExpose({ focusPanel })
</script>

<template>
  <form ref="panel" class="grid gap-4" @submit.prevent="emit('connect', code ? 'join' : 'create', nick, code)">
    <label class="grid gap-2 font-ui text-[9px] font-bold tracking-[.14em] text-[#b8c5d0]">
      YOUR NICKNAME
      <input v-model.trim="nick" maxlength="24" autocomplete="nickname" class="border border-sleet-line bg-[#07101a] px-3 py-3 text-sm text-white">
    </label>
    <label class="grid gap-2 font-ui text-[9px] font-bold tracking-[.14em] text-[#b8c5d0]">
      ROOM CODE
      <input v-model.trim="code" maxlength="6" placeholder="e.g. 3C9DD9" autocapitalize="characters" class="border border-sleet-line bg-[#07101a] px-3 py-3 text-sm uppercase text-white placeholder:text-[#5f7385]">
    </label>
    <div class="grid grid-cols-2 gap-3">
      <UiSleetButton gold :disabled="busy || !nick" @click="emit('connect', 'create', nick, '')">CREATE ROOM</UiSleetButton>
      <UiSleetButton :disabled="busy || !nick || !code" @click="emit('connect', 'join', nick, code)">JOIN</UiSleetButton>
    </div>

    <div class="grid gap-2 border-t border-white/10 pt-4">
      <div class="flex items-center justify-between gap-3">
        <span class="font-ui text-[8px] font-bold tracking-[.18em] text-sleet-gold">OPEN ROOMS</span>
        <button type="button" class="font-ui text-[9px] font-bold tracking-[.12em] text-sleet-ice hover:text-white" :disabled="busy" @click="emit('refresh')">
          REFRESH
        </button>
      </div>
      <div v-if="!rooms?.length" class="font-ui text-[10px] leading-5 text-[#91a1b0]">
        No online rooms right now. Create one to get started.
      </div>
      <button
        v-for="room in rooms"
        :key="room.code"
        type="button"
        class="grid grid-cols-[1fr_auto] items-center gap-3 border border-[#73859666] bg-[#07111bcc] px-3 py-2 text-left hover:border-sleet-gold"
        :disabled="busy || !nick"
        @click="code = room.code; emit('connect', 'join', nick, room.code)"
      >
        <span class="grid gap-1">
          <b class="font-display text-base text-white">{{ room.code }}</b>
          <small class="font-ui text-[9px] text-[#9fb0bd]">
            {{ room.host }} · {{ room.players }} fighter{{ room.players === 1 ? '' : 's' }}
            <template v-if="room.queue"> · queue {{ room.queue }}</template>
            <template v-if="room.active"> · in fight</template>
          </small>
        </span>
        <strong class="font-ui text-[9px] tracking-[.12em] text-sleet-gold">JOIN</strong>
      </button>
    </div>

    <p class="font-ui text-[10px] leading-5 text-[#91a1b0]">Create a room to run the queue, or join by code/list.</p>
  </form>
</template>
