<script setup lang="ts">
const lobby = useLobbyStore()
const route = useRoute()

const isOnline = computed(() => lobby.mode === 'online' || !!lobby.match)
const isLocal = computed(() => !isOnline.value)

/** Dev tools: Nuxt/Vite `nuxt dev`, or force with `?dev=1` on the fight URL. */
const isDeveloper = computed(() => {
  if (import.meta.dev) return true
  const flag = route.query.dev
  return flag === '1' || flag === 'true'
})

const showLocalTools = computed(() => isLocal.value)
const showDevTools = computed(() => isDeveloper.value)
const showToolbar = computed(() => showLocalTools.value || showDevTools.value)
</script>

<template>
  <nav v-show="showToolbar" class="fight-toolbar" :data-mode="isOnline ? 'online' : 'local'">
    <div>
      <template v-if="showLocalTools">
        <button id="choose" type="button">Fighters</button>
        <button id="lobbyreturn" type="button">Lobby</button>
        <button id="obs" type="button">OBS</button>
      </template>
      <template v-if="showDevTools">
        <NuxtLink to="/dev/game">Game Scene</NuxtLink>
        <button id="hitboxes" type="button" title="Green is the hurtbox. Red is the active attack." aria-pressed="false">
          Hitbox <kbd>F8</kbd>
        </button>
      </template>
    </div>
    <button v-if="showLocalTools" id="moves" type="button">
      PAUSE / COMMANDS <kbd>F9</kbd>
    </button>
  </nav>

  <!-- Runtime expects these ids; keep inert stubs when the visible controls are hidden. -->
  <div v-show="false" aria-hidden="true">
    <button v-if="!showLocalTools" id="choose" type="button" tabindex="-1" />
    <button v-if="!showLocalTools" id="lobbyreturn" type="button" tabindex="-1" />
    <button v-if="!showLocalTools" id="obs" type="button" tabindex="-1" />
    <button v-if="!showLocalTools" id="moves" type="button" tabindex="-1" />
  </div>
</template>
