<script setup lang="ts">
defineProps<{ name?: string }>()
</script>

<template>
  <div id="victory" class="victory-alert" aria-hidden="true">
    <div class="victory-stack">
      <div class="victory-plate top">
        <span class="victory-ink" aria-hidden="true" />
        <span class="victory-splatter" aria-hidden="true" />
        <strong id="victory-name">{{ name || '—' }}</strong>
      </div>
      <div class="victory-plate bot">
        <span class="victory-ink" aria-hidden="true" />
        <span class="victory-splatter" aria-hidden="true" />
        <strong id="victory-tag">WINS</strong>
      </div>
      <div id="victory-actions" class="victory-actions">
        <button id="victory-rematch" type="button">PLAY AGAIN</button>
        <button id="victory-lobby" type="button">BACK TO LOBBY</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.victory-alert {
  position: absolute;
  inset: 0;
  z-index: 7;
  display: grid;
  place-items: center;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition: opacity 180ms ease, visibility 180ms ease;
}

.victory-alert.show {
  opacity: 1;
  visibility: visible;
}

.victory-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(8px, 1.2vw, 16px);
  transform: translateY(-4%);
  filter: drop-shadow(0 14px 26px #000e);
}

.victory-alert.show .victory-stack {
  animation: victory-slam 520ms cubic-bezier(.12, .9, .2, 1.14) both;
}

.victory-plate {
  position: relative;
  display: grid;
  place-items: center;
  min-width: clamp(240px, 34vw, 420px);
  padding: clamp(12px, 1.5vw, 22px) clamp(34px, 4.2vw, 64px);
  color: #f6f6f6;
  isolation: isolate;
}

.victory-plate.top {
  transform: rotate(-2.8deg);
}

.victory-plate.bot {
  transform: rotate(2.2deg);
  min-width: clamp(160px, 18vw, 240px);
  padding: clamp(8px, 1vw, 14px) clamp(22px, 2.8vw, 40px);
}

.victory-ink {
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    radial-gradient(120% 90% at 18% 20%, #262626 0%, transparent 48%),
    radial-gradient(90% 80% at 86% 78%, #181818 0%, transparent 44%),
    linear-gradient(180deg, #171717, #050505 52%, #0c0c0c);
  clip-path: polygon(
    0% 16%, 3% 5%, 10% 1%, 18% 4%, 27% 0%, 36% 5%, 46% 1%, 55% 4%, 66% 0%, 76% 5%, 86% 1%, 94% 6%, 100% 15%,
    98% 30%, 100% 44%, 97% 58%, 100% 72%, 97% 86%, 91% 100%, 80% 96%, 69% 100%, 58% 97%, 47% 100%, 36% 96%,
    25% 100%, 14% 96%, 5% 100%, 0% 88%, 2% 74%, 0% 60%, 3% 46%, 0% 32%
  );
  box-shadow: inset 0 0 0 1px #ffffff14;
}

.victory-plate.bot .victory-ink {
  clip-path: polygon(
    1% 14%, 5% 3%, 14% 0%, 24% 5%, 35% 1%, 46% 5%, 57% 0%, 68% 4%, 79% 1%, 89% 6%, 97% 2%, 100% 18%,
    98% 36%, 100% 54%, 96% 72%, 100% 88%, 92% 100%, 78% 96%, 64% 100%, 50% 97%, 36% 100%, 22% 96%,
    10% 100%, 0% 86%, 2% 68%, 0% 50%, 3% 32%
  );
}

.victory-plate strong {
  position: relative;
  z-index: 2;
  font-family: Impact, Haettenschweiler, "Arial Narrow Bold", "Franklin Gothic Bold", sans-serif;
  font-size: clamp(36px, 5.8vw, 78px);
  font-weight: 400;
  letter-spacing: .05em;
  line-height: .92;
  text-transform: uppercase;
  text-shadow: 0 1px 0 #000, 0 0 1px #fff6;
  white-space: nowrap;
}

.victory-plate.bot strong {
  font-size: clamp(26px, 3.6vw, 46px);
  letter-spacing: .12em;
}

.victory-splatter {
  position: absolute;
  inset: -20% -14%;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(circle at 5% 14%, #fff 0 1.3px, transparent 1.6px),
    radial-gradient(circle at 12% 82%, #fff 0 1.8px, transparent 2.2px),
    radial-gradient(circle at 21% 3%, #fff 0 1px, transparent 1.3px),
    radial-gradient(circle at 33% 98%, #fff 0 1.5px, transparent 1.9px),
    radial-gradient(circle at 47% -2%, #fff 0 1.2px, transparent 1.5px),
    radial-gradient(circle at 58% 100%, #fff 0 1.7px, transparent 2.1px),
    radial-gradient(circle at 70% 10%, #fff 0 1.4px, transparent 1.7px),
    radial-gradient(circle at 81% 92%, #fff 0 1px, transparent 1.3px),
    radial-gradient(circle at 90% 24%, #fff 0 2px, transparent 2.4px),
    radial-gradient(circle at 96% 66%, #fff 0 1.2px, transparent 1.5px),
    radial-gradient(circle at 1% 46%, #fff 0 1.6px, transparent 2px),
    radial-gradient(circle at 99% 38%, #fff 0 1px, transparent 1.3px),
    radial-gradient(circle at 42% -8%, #fff 0 1.4px, transparent 1.7px),
    radial-gradient(circle at 18% 110%, #070707 0 6px, transparent 6.5px),
    radial-gradient(circle at 88% -10%, #050505 0 7px, transparent 7.5px),
    radial-gradient(circle at -4% 28%, #0a0a0a 0 5px, transparent 5.5px),
    radial-gradient(circle at 106% 74%, #080808 0 6px, transparent 6.5px);
  opacity: .95;
}

.victory-plate.bot .victory-splatter {
  transform: scaleX(-1) rotate(-3deg);
  opacity: .88;
}

.victory-ink::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(-14deg, transparent 0 6px, #ffffff08 6px 7px),
    linear-gradient(100deg, #fff2, transparent 18%, transparent 78%, #fff1);
  opacity: .55;
  mix-blend-mode: soft-light;
}

.victory-actions {
  display: none;
  gap: clamp(10px, 1.4vw, 16px);
  margin-top: clamp(10px, 1.6vw, 22px);
  pointer-events: auto;
  filter: none;
}

.victory-alert.local.show .victory-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  animation: victory-actions-in 420ms 180ms ease-out both;
}

.victory-actions button {
  min-width: clamp(150px, 18vw, 210px);
  padding: 12px 18px;
  border: 1px solid #8a919988;
  background: linear-gradient(180deg, #2a333c, #12171d);
  color: #f0f2f4;
  font: 700 clamp(10px, 1.05vw, 12px) Verdana, Geneva, sans-serif;
  letter-spacing: .08em;
  text-transform: uppercase;
  text-shadow: 0 1px 2px #000c;
  box-shadow: inset 0 1px #ffffff14, 0 8px 18px #000a;
  cursor: pointer;
  transition: filter 120ms ease, border-color 120ms ease, transform 120ms ease;
}

.victory-actions button:hover {
  border-color: #d4b06b;
  filter: brightness(1.18);
}

.victory-actions button:active {
  transform: translateY(1px);
}

#victory-rematch {
  border-color: #3d7ea088;
  background: linear-gradient(180deg, #2a4d63, #102231);
}

#victory-rematch:hover {
  border-color: #7ec8ff;
}

@keyframes victory-slam {
  0% {
    opacity: 0;
    transform: translateY(-4%) scale(1.38) rotate(5deg);
  }
  52% {
    opacity: 1;
    transform: translateY(-4%) scale(.94) rotate(-.6deg);
  }
  100% {
    opacity: 1;
    transform: translateY(-4%) scale(1) rotate(0);
  }
}

@keyframes victory-actions-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 700px) {
  .victory-plate {
    min-width: min(86vw, 320px);
    padding: 11px 24px;
  }

  .victory-plate.bot {
    min-width: min(52vw, 200px);
  }

  .victory-plate strong {
    font-size: clamp(30px, 10vw, 48px);
  }

  .victory-plate.bot strong {
    font-size: clamp(22px, 6.5vw, 34px);
  }

  .victory-actions {
    flex-direction: column;
    width: min(86vw, 280px);
  }

  .victory-actions button {
    width: 100%;
  }
}
</style>
