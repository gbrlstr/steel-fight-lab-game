# Bristleback projectile

Source: local Dota 2 pak01_dir.vpk. Extracted with Source 2 Viewer 19.1.
The fighting-game hero definition points to particles/units/heroes/hero_bristleback/bristleback_viscous_nasal_goo.vpcf.
Its molten, trail and drips children reference particle_glow_04, lava_blast, spray1 and droplets textures.
Original decompiled definitions and complete extracted sequences: imports/effects.
Browser subset: public/effects/bristleback (62 PNGs, no synthetic texture replacements).

src/render/projectile-effects.ts implements an approximate sprite renderer for this specific effect. Colors, layers, 0.6–0.8s lifetimes and gravity are based on the definitions; emission count, position lock, blending/overbright and animation timing are adapted. It is not a Source 2 VPCF runtime or a claim of pixel-identical fidelity. Projectile collision, speed and damage continue to come from shared combat state. Other heroes and impact particles remain provisional. Textures are shared within a page and disposed on teardown.

Visual fixture: /tests/effects.html. Production build checked. Keep Valve assets local.
The molten layer uses the exported texture luminance as a tint mask to reproduce green goo instead of its baked orange coloration.

## Tusk and Shendelzare
Tusk: fighting_game_tusk_ice_shards_projectile_stout.vpcf and its model child reference models/items/tuskarr/whiskey_the_stout/whiskey_the_stout_slider.vmdl. Exported the original GLB and whiskey_shards_slide animation, frost sequence, crystal sprite and blue energy beam. Materials use VRF fallback conversion because the installed exporter does not support VCS shader version 71; verify appearance against Source 2. Shendelzare: vengeful_magic_missile.vpcf uses glow05, aircraft_white_v2, yellowflare2 and cone-gradient sprites with pink/purple colors. Both are scoped visual adaptations, not complete Source 2 simulation. Tusk and Vengeful replace all remaining projectile wireframe spheres. Marci and Dawnbreaker have no projectileParticle entries in the current fighting-game roster.

## Hit and block
fighting_game_hitspark.vpcf (flash, stylized explosion core, heroring and glow/fleks sparks) and fighting_game_blockspark.vpcf (cyan particle_sphere_highlight5 edge; the half-sphere dome model is approximated by the same highlight plus a short glow). Browser sprites in src/render/hit-sparks.ts use the exported textures and fixed 0.2–0.55s lifetimes so burst size does not depend on frame rate. Not a Source 2 VPCF runtime.
Preview: /tests/effects.html?hero=tusk or ?hero=vengeful.
