<script setup lang="ts">
defineProps<{ left?: string; right?: string }>()
</script>

<template>
  <div id="versus" class="versus-alert" aria-hidden="true">
    <div class="versus-stack">
      <div class="versus-plate top">
        <span class="versus-ink" aria-hidden="true" />
        <span class="versus-splatter" aria-hidden="true" />
        <strong id="versus0">{{ left || '—' }}</strong>
      </div>
      <span class="versus-x" aria-hidden="true">x</span>
      <div class="versus-plate bot">
        <span class="versus-ink" aria-hidden="true" />
        <span class="versus-splatter" aria-hidden="true" />
        <strong id="versus1">{{ right || '—' }}</strong>
      </div>
    </div>
  </div>
</template>

<style scoped>
.versus-alert {
  position: absolute;
  inset: 0;
  z-index: 6;
  display: grid;
  place-items: center;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition: opacity 140ms ease, visibility 140ms ease;
}

.versus-alert.show {
  opacity: 1;
  visibility: visible;
}

.versus-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(4px, .9vw, 12px);
  transform: translateY(-2%);
  filter: drop-shadow(0 12px 22px #000d);
}

.versus-alert.show .versus-stack {
  animation: versus-slam 420ms cubic-bezier(.15, .9, .2, 1.12) both;
}

.versus-plate {
  position: relative;
  display: grid;
  place-items: center;
  min-width: clamp(220px, 30vw, 380px);
  padding: clamp(11px, 1.4vw, 20px) clamp(30px, 3.8vw, 56px);
  color: #f5f5f5;
  isolation: isolate;
}

.versus-plate.top {
  transform: rotate(2.6deg);
}

.versus-plate.bot {
  transform: rotate(-3deg);
}

.versus-ink {
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    radial-gradient(120% 90% at 20% 18%, #222 0%, transparent 48%),
    radial-gradient(90% 80% at 84% 82%, #141414 0%, transparent 44%),
    linear-gradient(180deg, #151515, #050505 52%, #0b0b0b);
  clip-path: polygon(
    1% 18%, 3% 6%, 8% 2%, 16% 5%, 24% 1%, 33% 4%, 41% 0%, 52% 3%, 61% 1%, 72% 4%, 81% 0%, 90% 5%, 97% 2%, 100% 14%,
    98% 28%, 100% 42%, 97% 55%, 100% 68%, 98% 82%, 96% 94%, 88% 100%, 78% 96%, 68% 100%, 57% 97%, 46% 100%, 36% 96%,
    26% 100%, 16% 97%, 7% 100%, 0% 88%, 2% 72%, 0% 58%, 3% 44%, 0% 30%
  );
  box-shadow: inset 0 0 0 1px #ffffff14;
}

.versus-plate.bot .versus-ink {
  clip-path: polygon(
    0% 12%, 4% 3%, 12% 0%, 21% 4%, 30% 1%, 40% 5%, 49% 0%, 58% 4%, 69% 1%, 78% 5%, 87% 0%, 95% 6%, 100% 16%,
    98% 31%, 100% 46%, 97% 59%, 100% 73%, 97% 86%, 92% 100%, 82% 96%, 71% 100%, 60% 97%, 49% 100%, 38% 96%,
    28% 100%, 17% 96%, 8% 100%, 0% 90%, 2% 76%, 0% 62%, 3% 48%, 0% 34%
  );
}

.versus-plate strong {
  position: relative;
  z-index: 2;
  font-family: Impact, Haettenschweiler, "Arial Narrow Bold", "Franklin Gothic Bold", sans-serif;
  font-size: clamp(34px, 5.5vw, 74px);
  font-weight: 400;
  letter-spacing: .045em;
  line-height: .92;
  text-transform: uppercase;
  text-shadow: 0 1px 0 #000, 0 0 1px #fff6;
  white-space: nowrap;
}

.versus-x {
  position: relative;
  z-index: 2;
  margin: -4px 0;
  color: #f3f3f3;
  font-family: Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif;
  font-size: clamp(15px, 1.9vw, 24px);
  line-height: 1;
  text-shadow: 0 2px 5px #000c;
  transform: rotate(-5deg);
}

.versus-splatter {
  position: absolute;
  inset: -18% -12%;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(circle at 6% 16%, #fff 0 1.2px, transparent 1.5px),
    radial-gradient(circle at 11% 78%, #fff 0 1.7px, transparent 2.1px),
    radial-gradient(circle at 19% 4%, #fff 0 1px, transparent 1.3px),
    radial-gradient(circle at 27% 96%, #fff 0 1.4px, transparent 1.8px),
    radial-gradient(circle at 38% 0%, #fff 0 1.1px, transparent 1.4px),
    radial-gradient(circle at 49% 100%, #fff 0 1.6px, transparent 2px),
    radial-gradient(circle at 61% 8%, #fff 0 1.3px, transparent 1.6px),
    radial-gradient(circle at 72% 94%, #fff 0 1px, transparent 1.3px),
    radial-gradient(circle at 83% 22%, #fff 0 1.9px, transparent 2.3px),
    radial-gradient(circle at 91% 68%, #fff 0 1.2px, transparent 1.5px),
    radial-gradient(circle at 2% 48%, #fff 0 1.5px, transparent 1.9px),
    radial-gradient(circle at 98% 40%, #fff 0 .9px, transparent 1.2px),
    radial-gradient(circle at 54% -6%, #fff 0 1.3px, transparent 1.6px),
    radial-gradient(circle at 15% 108%, #070707 0 5px, transparent 5.5px),
    radial-gradient(circle at 86% -8%, #050505 0 6px, transparent 6.5px),
    radial-gradient(circle at -2% 30%, #0a0a0a 0 4px, transparent 4.5px),
    radial-gradient(circle at 104% 70%, #080808 0 5px, transparent 5.5px);
  opacity: .95;
}

.versus-plate.bot .versus-splatter {
  transform: scaleX(-1) rotate(4deg);
  opacity: .88;
}

.versus-ink::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(-16deg, transparent 0 6px, #ffffff07 6px 7px),
    linear-gradient(100deg, #fff2, transparent 18%, transparent 78%, #fff1);
  opacity: .55;
  mix-blend-mode: soft-light;
}

@keyframes versus-slam {
  0% {
    opacity: 0;
    transform: translateY(-2%) scale(1.3) rotate(-4deg);
  }
  55% {
    opacity: 1;
    transform: translateY(-2%) scale(.96) rotate(.5deg);
  }
  100% {
    opacity: 1;
    transform: translateY(-2%) scale(1) rotate(0);
  }
}

@media (max-width: 700px) {
  .versus-plate {
    min-width: min(82vw, 310px);
    padding: 10px 22px;
  }

  .versus-plate strong {
    font-size: clamp(28px, 9vw, 44px);
  }
}
</style>
