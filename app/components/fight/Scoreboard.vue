<template>
  <div class="scoreboard">
    <img class="hud-bg" src="/ui/hud_background_png.png" alt="">
    <FightFighterHud :index="0" side="left" />
    <FightTimer />
    <FightFighterHud :index="1" side="right" />
  </div>
</template>
