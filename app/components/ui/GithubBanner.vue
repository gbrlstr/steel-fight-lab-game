<script setup lang="ts">
const config = useRuntimeConfig()
const href = computed(() => String(config.public.githubUrl || 'https://github.com/gbrlstr/steel-fight-lab-game'))
</script>

<template>
  <a
    class="github-banner group fixed inset-x-0 top-0 z-60 flex h-10 items-center justify-center gap-2.5 border-b border-[#d2ac5d33] px-4 font-ui no-underline"
    :href="href"
    target="_blank"
    rel="noopener noreferrer"
  >
    <span class="github-banner__glow" aria-hidden="true" />
    <svg class="size-4 shrink-0 fill-current text-[#e8eef4] transition group-hover:text-white" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
    <span class="text-[10px] font-bold tracking-[.14em] text-[#e8eef4] transition group-hover:text-white max-sm:hidden">
      OPEN SOURCE · STAR &amp; CONTRIBUTE ON GITHUB
    </span>
    <span class="hidden text-[10px] font-bold tracking-[.14em] text-[#e8eef4] transition group-hover:text-white max-sm:inline">
      GITHUB
    </span>
    <span class="rounded-sm border border-[#d2ac5d66] bg-[#d2ac5d18] px-1.5 py-0.5 text-[8px] font-bold tracking-[.12em] text-sleet-gold">
      PUBLIC
    </span>
  </a>
</template>

<style scoped>
.github-banner {
  background:
    linear-gradient(90deg, rgb(8 14 22 / 92%), rgb(18 28 40 / 96%) 40%, rgb(28 36 28 / 94%) 70%, rgb(8 14 22 / 92%));
  color: #e8eef4;
  box-shadow: 0 10px 28px rgb(0 0 0 / 35%);
  backdrop-filter: blur(10px);
}

.github-banner__glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(90deg, transparent, rgb(210 172 93 / 12%), transparent);
  opacity: 0;
  transition: opacity 180ms ease;
}

.github-banner:hover .github-banner__glow {
  opacity: 1;
}
</style>
