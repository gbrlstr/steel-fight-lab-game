<template>
  <div class="scoreboard">
    <img class="hud-bg" src="/ui/hud_background_png.png" alt="">
    <FightTimer />
    <div class="scoreboard-fighters">
      <FightFighterHud :index="0" side="left" />
      <FightFighterHud :index="1" side="right" />
    </div>
  </div>
</template>
