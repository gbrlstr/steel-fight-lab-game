<template>
  <div id="roundcall" class="round-alert" aria-hidden="true">
    <div class="round-stack">
      <div class="round-plate">
        <span class="round-ink" aria-hidden="true" />
        <span class="round-splatter" aria-hidden="true" />
        <strong id="roundcall-text">ROUND 1</strong>
      </div>
    </div>
  </div>
</template>

<style scoped>
.round-alert {
  position: absolute;
  inset: 0;
  z-index: 6;
  display: grid;
  place-items: center;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition: opacity 120ms ease, visibility 120ms ease;
}

.round-alert.show {
  opacity: 1;
  visibility: visible;
}

.round-stack {
  display: grid;
  place-items: center;
  transform: translateY(-4%);
  filter: drop-shadow(0 12px 22px #000d);
}

.round-alert.show .round-stack {
  animation: round-slam 380ms cubic-bezier(.14, .9, .2, 1.16) both;
}

.round-alert.fight .round-stack {
  animation: fight-slam 420ms cubic-bezier(.12, .85, .2, 1.2) both;
}

.round-plate {
  position: relative;
  display: grid;
  place-items: center;
  min-width: clamp(220px, 32vw, 420px);
  padding: clamp(14px, 1.7vw, 24px) clamp(34px, 4.4vw, 68px);
  color: #f6f6f6;
  isolation: isolate;
  transform: rotate(-2.4deg);
}

.round-alert.fight .round-plate {
  transform: rotate(2.8deg);
  min-width: clamp(180px, 24vw, 300px);
}

.round-ink {
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    radial-gradient(120% 90% at 18% 20%, #262626 0%, transparent 48%),
    radial-gradient(90% 80% at 86% 78%, #181818 0%, transparent 44%),
    linear-gradient(180deg, #171717, #050505 52%, #0c0c0c);
  clip-path: polygon(
    0% 16%, 3% 5%, 11% 1%, 20% 4%, 30% 0%, 40% 5%, 51% 1%, 61% 4%, 72% 0%, 82% 5%, 92% 1%, 100% 14%,
    98% 30%, 100% 46%, 97% 60%, 100% 74%, 96% 88%, 88% 100%, 76% 96%, 64% 100%, 52% 97%, 40% 100%,
    28% 96%, 16% 100%, 6% 96%, 0% 84%, 2% 68%, 0% 52%, 3% 36%
  );
  box-shadow: inset 0 0 0 1px #ffffff14;
}

.round-alert.fight .round-ink {
  background:
    radial-gradient(120% 90% at 22% 18%, #3a1814 0%, transparent 48%),
    radial-gradient(90% 80% at 80% 82%, #1a0c0a 0%, transparent 44%),
    linear-gradient(180deg, #2a1210, #0a0504 52%, #140808);
}

.round-plate strong {
  position: relative;
  z-index: 2;
  font-family: Impact, Haettenschweiler, "Arial Narrow Bold", "Franklin Gothic Bold", sans-serif;
  font-size: clamp(34px, 5.6vw, 76px);
  font-weight: 400;
  letter-spacing: .08em;
  line-height: .92;
  text-transform: uppercase;
  text-shadow: 0 1px 0 #000, 0 0 1px #fff6;
  white-space: nowrap;
}

.round-alert.fight strong {
  font-size: clamp(42px, 7vw, 92px);
  letter-spacing: .12em;
  color: #fff4e8;
  text-shadow: 0 1px 0 #000, 0 0 12px #ff6a2a66;
}

.round-splatter {
  position: absolute;
  inset: -18% -12%;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(circle at 6% 16%, #fff 0 1.2px, transparent 1.5px),
    radial-gradient(circle at 14% 84%, #fff 0 1.7px, transparent 2.1px),
    radial-gradient(circle at 28% 4%, #fff 0 1px, transparent 1.3px),
    radial-gradient(circle at 44% 98%, #fff 0 1.5px, transparent 1.9px),
    radial-gradient(circle at 62% 8%, #fff 0 1.3px, transparent 1.6px),
    radial-gradient(circle at 78% 92%, #fff 0 1px, transparent 1.3px),
    radial-gradient(circle at 90% 26%, #fff 0 1.8px, transparent 2.2px),
    radial-gradient(circle at 96% 64%, #fff 0 1.1px, transparent 1.4px),
    radial-gradient(circle at 2% 48%, #fff 0 1.4px, transparent 1.8px),
    radial-gradient(circle at 18% 108%, #070707 0 5px, transparent 5.5px),
    radial-gradient(circle at 88% -8%, #050505 0 6px, transparent 6.5px);
  opacity: .95;
}

.round-ink::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(-16deg, transparent 0 6px, #ffffff07 6px 7px),
    linear-gradient(100deg, #fff2, transparent 18%, transparent 78%, #fff1);
  opacity: .55;
  mix-blend-mode: soft-light;
}

@keyframes round-slam {
  0% {
    opacity: 0;
    transform: translateY(-4%) scale(1.34) rotate(-5deg);
  }
  55% {
    opacity: 1;
    transform: translateY(-4%) scale(.96) rotate(.5deg);
  }
  100% {
    opacity: 1;
    transform: translateY(-4%) scale(1) rotate(0);
  }
}

@keyframes fight-slam {
  0% {
    opacity: 0;
    transform: translateY(-4%) scale(1.5) rotate(6deg);
  }
  50% {
    opacity: 1;
    transform: translateY(-4%) scale(.92) rotate(-1deg);
  }
  100% {
    opacity: 1;
    transform: translateY(-4%) scale(1) rotate(0);
  }
}

@media (max-width: 700px) {
  .round-plate {
    min-width: min(84vw, 320px);
    padding: 12px 24px;
  }

  .round-plate strong {
    font-size: clamp(28px, 9vw, 46px);
  }

  .round-alert.fight strong {
    font-size: clamp(36px, 11vw, 56px);
  }
}
</style>
