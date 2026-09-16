<script setup lang="ts">
const props = defineProps<{ hero: string; skin?: string }>()
const emit = defineEmits<{ loaded: []; ready: [hero: string] }>()
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
const heroSlot = useTemplateRef<HTMLElement>('heroSlot')
let dispose: (() => void) | undefined

onMounted(async () => {
  await nextTick()
  const root = canvas.value?.closest<HTMLElement>('.pick-page')
  if (!root || !canvas.value || !heroSlot.value) return
  dispose = createHeroPreview(
    root,
    canvas.value,
    heroSlot.value,
    () => props.hero,
    () => props.skin || 'default',
    () => emit('loaded'),
    id => emit('ready', id),
  )
})

onBeforeUnmount(() => dispose?.())
</script>

<template>
  <canvas ref="canvas" class="pointer-events-none absolute inset-0 z-[5] h-full w-full" />
  <div ref="heroSlot" class="pointer-events-none absolute inset-y-0 left-0 z-[6] w-[56%] max-md:w-[82%]" />
</template>
