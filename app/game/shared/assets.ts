export const portrait = (hero: string, selection = false) =>
  `/ui/${selection ? 'selection/' : ''}npc_dota_hero_${hero === 'vengeful' ? 'vengefulspirit_alt1' : hero}_png.png`
