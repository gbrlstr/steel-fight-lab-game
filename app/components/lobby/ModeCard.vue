<script setup lang="ts">
defineProps<{ number: string; eyebrow: string; title: string; description: string; interactive?: boolean }>()
defineEmits<{ select: [] }>()
</script>

<template>
  <button
    :type="interactive ? 'button' : undefined"
    class="sleet-panel flex w-full items-center gap-4 p-4 text-left"
    :class="{ 'cursor-pointer hover:border-sleet-gold hover:brightness-110': interactive }"
    :disabled="!interactive"
    @click="interactive && $emit('select')"
  >
    <span class="font-display text-3xl text-sleet-gold">{{ number }}</span>
    <span class="grid gap-1">
      <small class="font-ui text-[9px] font-bold tracking-[.17em] text-[#9fb0c0]">{{ eyebrow }}</small>
      <b class="font-display text-xl text-white">{{ title }}</b>
      <em class="font-ui text-[10px] not-italic text-[#aebbc7]">{{ description }}</em>
    </span>
    <strong v-if="interactive" class="ml-auto text-2xl text-sleet-gold">→</strong>
  </button>
</template>
