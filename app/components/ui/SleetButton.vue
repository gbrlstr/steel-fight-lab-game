<script setup lang="ts">
withDefaults(defineProps<{ gold?: boolean; disabled?: boolean }>(), {
  gold: false,
  disabled: false,
})
</script>

<template>
  <button
    type="button"
    class="sleet-button px-5"
    :class="{ 'sleet-button-gold': gold }"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>
