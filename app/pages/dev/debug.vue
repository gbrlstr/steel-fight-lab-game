<script setup lang="ts">
import { mountDebugPage } from '../../game/runtime/dev-debug'

definePageMeta({ alias: ['/debug'] })
const host = useTemplateRef<HTMLElement>('host')
let dispose: (() => void) | undefined

onMounted(() => {
  if (host.value) dispose = mountDebugPage(host.value)
})

onBeforeUnmount(() => dispose?.())
</script>

<template>
  <div ref="host" class="h-full w-full overflow-auto bg-[#090b10]" />
</template>
