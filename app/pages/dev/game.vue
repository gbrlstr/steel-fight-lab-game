<script setup lang="ts">
import { mountGamePage } from '../../game/render/arena-game'

definePageMeta({ alias: ['/game'] })
const host = useTemplateRef<HTMLElement>('host')
let dispose: (() => void) | undefined

onMounted(() => {
  if (host.value) dispose = mountGamePage(host.value)
})

onBeforeUnmount(() => dispose?.())
</script>

<template>
  <div ref="host" class="h-full w-full" />
</template>
