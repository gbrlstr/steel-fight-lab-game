<script setup lang="ts">
const boot = useGamePreload()

onMounted(() => {
  void boot.start()
})
</script>

<template>
  <div class="h-dvh w-screen overflow-hidden bg-sleet-ink text-sleet-text">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <UiSettingsDock />
    <UiLoadingOverlay
      v-if="!boot.ready.value"
      :label="boot.label.value"
      :progress="boot.progress.value"
      initial
    />
  </div>
</template>
