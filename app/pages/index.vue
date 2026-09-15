<script setup lang="ts">
import { sfx } from '../game/audio/game-audio'

const art = new URL('../assets/menu/steelfightlab_titlescreen_art.png', import.meta.url).href
const logo = new URL('../assets/menu/steelfightlab_logo.png', import.meta.url).href

useHead({ title: 'Steel Fight Lab' })

onMounted(() => sfx.menu())

async function fight() {
  sfx.confirm()
  await navigateTo('/lobby')
}
</script>

<template>
  <main class="title-screen relative h-full overflow-hidden bg-sleet-ink font-display">
    <UiGithubBanner />
    <img
      :src="art"
      alt=""
      class="title-art absolute inset-0 h-full w-full object-cover object-[32%_center]"
    >
    <div class="title-veil absolute inset-0" aria-hidden="true" />
    <div class="title-grain absolute inset-0" aria-hidden="true" />

    <section class="title-panel absolute inset-y-0 right-0 z-10 flex w-[min(560px,54vw)] flex-col items-center justify-center px-[clamp(22px,5.5vw,80px)] pt-10 max-sm:w-full max-sm:justify-end max-sm:pb-[10vh]">
      <img
        :src="logo"
        alt="Steel Fight Lab"
        class="title-logo w-[min(420px,82vw)] drop-shadow-[0_14px_22px_#000c]"
      >

      <p class="title-tagline mt-5 max-w-[34ch] text-center font-ui text-[11px] leading-5 tracking-[.04em] text-[#c8d5e0]">
        Online 1v1 arena fights, rooms, and brackets — built for the browser.
      </p>

      <UiSleetButton
        gold
        class="title-cta mt-7 min-h-14 w-[min(280px,78vw)] text-sm tracking-[.16em]"
        @click="fight"
      >
        FIGHT!
      </UiSleetButton>

      <div class="title-meta mt-6 flex max-w-[38ch] flex-col items-center gap-2 text-center">
        <p class="font-ui text-[9px] font-bold tracking-[.2em] text-sleet-gold">
          STEEL FIGHT · FAN LAB
        </p>
        <p class="font-ui text-[10px] leading-4 tracking-[.02em] text-[#9aabba]">
          Prototype fighting lab inspired by Dota 2 arena modes.
          Local duels and online rooms — no account required.
        </p>
        <p class="title-disclaimer mt-1 font-ui text-[9px] leading-4 tracking-[.03em] text-[#6f8192]">
          <strong class="font-bold text-[#8a9aa8]">Credits:</strong>
          Hero models, animations, maps, textures, UI art, and related media shown here are
          © Valve Corporation / Dota 2. They are not owned by Steel Fight Lab.
          Not affiliated with Valve. Unofficial fan project.
          See <span class="text-[#a8b8c6]">CREDITS.md</span> in the repository.
        </p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.title-veil {
  background:
    linear-gradient(90deg, transparent 28%, rgb(2 5 11 / 42%) 55%, rgb(2 5 11 / 92%) 100%),
    linear-gradient(0deg, rgb(2 5 11 / 72%) 0%, transparent 42%),
    radial-gradient(ellipse 55% 70% at 78% 48%, rgb(8 18 30 / 55%), transparent 70%);
}

.title-grain {
  opacity: .18;
  mix-blend-mode: soft-light;
  pointer-events: none;
  background-image:
    radial-gradient(circle at 20% 30%, #fff2 0 1px, transparent 1.5px),
    radial-gradient(circle at 70% 60%, #9de7ff22 0 1px, transparent 1.6px),
    radial-gradient(circle at 40% 80%, #fff1 0 .8px, transparent 1.2px);
  background-size: 180px 180px, 220px 220px, 140px 140px;
  animation: title-drift 18s linear infinite;
}

.title-art {
  animation: title-ken 22s ease-in-out infinite alternate;
  transform-origin: 32% center;
}

.title-logo {
  animation: title-in 700ms cubic-bezier(.16, .9, .22, 1) both;
}

.title-tagline {
  animation: title-in 780ms 80ms cubic-bezier(.16, .9, .22, 1) both;
}

.title-cta {
  animation: title-in 860ms 140ms cubic-bezier(.16, .9, .22, 1) both;
  box-shadow: 0 10px 28px rgb(0 0 0 / 45%), 0 0 0 1px rgb(210 172 93 / 18%);
  transition: transform 160ms ease, filter 160ms ease, box-shadow 160ms ease;
}

.title-cta:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.08);
  box-shadow: 0 14px 32px rgb(0 0 0 / 55%), 0 0 24px rgb(210 172 93 / 18%);
}

.title-meta {
  animation: title-in 940ms 200ms cubic-bezier(.16, .9, .22, 1) both;
}

.title-disclaimer {
  border-top: 1px solid rgb(255 255 255 / 10%);
  padding-top: 10px;
}

@keyframes title-in {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes title-ken {
  from { transform: scale(1.02); }
  to { transform: scale(1.06); }
}

@keyframes title-drift {
  from { background-position: 0 0, 40px 20px, 10px 30px; }
  to { background-position: 60px 40px, -30px 50px, 40px -20px; }
}

@media (prefers-reduced-motion: reduce) {
  .title-art,
  .title-grain,
  .title-logo,
  .title-tagline,
  .title-cta,
  .title-meta {
    animation: none;
  }
}

@media (max-width: 640px) {
  .title-veil {
    background:
      linear-gradient(0deg, rgb(2 5 11 / 94%) 0%, rgb(2 5 11 / 55%) 38%, transparent 70%),
      linear-gradient(90deg, transparent 10%, rgb(2 5 11 / 35%) 100%);
  }
}
</style>
