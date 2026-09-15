<script setup lang="ts">
import type { LobbyRoom } from '../../game/net/lobby-session'
import { roster } from '../../game/shared/combat'
import { portrait } from '../../game/shared/assets'

defineProps<{ room: LobbyRoom; ownId: string }>()

function state(room: LobbyRoom, id: string, ready: boolean, online: boolean) {
  if (!online) {
    if (room.paused && room.missing?.includes(id)) return 'RECONNECTING'
    return 'OFFLINE'
  }
  if (ready) return 'READY'
  if (room.pair.includes(id)) return 'CALLED'
  if (room.queue.includes(id)) return 'IN QUEUE'
  return 'IN LOBBY'
}
</script>

<template>
  <ol class="grid max-h-60 gap-2 overflow-y-auto pr-1">
    <li
      v-for="person in room.people"
      :key="person.id"
      class="grid grid-cols-[42px_1fr_auto] items-center gap-3 border border-[#57697a66] bg-[#08131dcc] p-2"
      :class="{
        'border-sleet-gold/70': person.id === ownId,
        'opacity-55': !person.online,
      }"
    >
      <img :src="portrait(person.hero)" alt="" class="size-10 object-cover">
      <span class="grid">
        <b class="font-display text-sm text-white">{{ person.nick }}</b>
        <small class="font-ui text-[8px] tracking-[.08em] text-[#9babb9]">
          {{ roster[person.hero]?.name ?? person.hero }}{{ person.id === room.host ? ' · HOST' : '' }}
        </small>
      </span>
      <em
        class="font-ui text-[8px] font-bold not-italic"
        :class="person.online ? 'text-sleet-ice' : 'text-[#df7777]'"
      >
        {{ state(room, person.id, person.ready, person.online) }}
      </em>
    </li>
  </ol>
</template>
