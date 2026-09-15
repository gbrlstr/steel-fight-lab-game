<script setup lang="ts">
import type { LobbyRoom } from '../../game/net/lobby-session'

defineProps<{ room: LobbyRoom }>()
</script>

<template>
  <div v-if="room.bracket.length" class="grid gap-1 border-l-2 border-sleet-gold/40 pl-3">
    <p v-for="(match, index) in room.bracket" :key="index" class="font-ui text-[9px] text-[#b9c7d3]">
      ROUND {{ match.round }} ·
      {{ match.players.map(id => room.people.find(person => person.id === id)?.nick ?? 'Fighter').join(' × ') }}
      {{ match.done ? ' · DONE' : '' }}
    </p>
  </div>
</template>
