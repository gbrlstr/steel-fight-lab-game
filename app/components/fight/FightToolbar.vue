<template>
  <nav class="fight-toolbar">
    <div>
      <button id="choose" type="button">Fighters</button>
      <button id="lobbyreturn" type="button">Lobby</button>
      <button id="obs" type="button">OBS</button>
      <NuxtLink to="/dev/game">Game Scene</NuxtLink>
      <button id="hitboxes" type="button" title="Green is the hurtbox. Red is the active attack." aria-pressed="true">
        Hitbox <kbd>F8</kbd>
      </button>
    </div>
    <button id="moves" type="button">PAUSE / COMMANDS <kbd>F9</kbd></button>
  </nav>
</template>
