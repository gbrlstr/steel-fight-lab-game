<script setup lang="ts">
import type { State } from '../../game/shared/combat'
import { createFightRuntime } from '../../game/runtime/fight-runtime'

const props = defineProps<{ state: State }>()
const stage = useTemplateRef<HTMLElement>('stage')
let dispose: (() => void) | undefined

onMounted(async () => {
  await nextTick()
  const root = stage.value?.closest<HTMLElement>('.fight-app')
  if (!root) return
  dispose = createFightRuntime(root, {
    state: props.state,
    navigate: path => void navigateTo(path),
  })
})

onBeforeUnmount(() => dispose?.())
</script>

<template>
  <div id="stage" ref="stage" />
</template>
