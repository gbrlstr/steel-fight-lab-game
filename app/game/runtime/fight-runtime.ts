import { hitSparks, type HitSpark } from '../render/hit-sparks'
import { netherSwapFx, type SwapBurst } from '../render/nether-swap'
import { marciUnleashFx, type UnleashAura, type UnleashBurst } from '../render/marci-unleash'
import { dawnbreakerLuminosityFx, type LuminosityBurst } from '../render/dawnbreaker-luminosity'
import { projectileEffects, type ProjectileVisual } from '../render/projectile-effects'
import * as T from 'three'
import { mountArena } from '../render/arena-game'
import { portrait } from '../shared/assets'
import { acquireFighter, fighterStocked, FIGHTER_PRESENCE, loadFighter, releaseFighter } from '../render/fighters'
import { hitboxDebug } from '../render/hitbox-debug'
import { FX_LAYER, heroOutline, tagFx, tagHero } from '../render/hero-outline'
import { initial, step, roster, RULES } from '../shared/combat'
const mix = (a: number, b: number, t: number) => Math.round(a + (b - a) * t)
const hpPaint = (t: number) => {
    const c = (g: number[], r: number[]) => `rgb(${mix(r[0], g[0], t)},${mix(r[1], g[1], t)},${mix(r[2], g[2], t)})`
    return `linear-gradient(${c([255, 245, 181], [255, 168, 168])},${c([229, 199, 107], [220, 48, 48])} 46%,${c([152, 112, 56], [92, 16, 16])})`
}
import labels from '../shared/labels.json'
import { controls } from '../input/controls'
import { lobbySession } from '../net/lobby-session'
import { frameFight } from '../render/fight-camera'
import { sfx } from '../audio/game-audio'
const escape = (v: unknown) => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
export type FightRuntimeOptions = {
    state?: ReturnType<typeof initial>
    navigate?: (path: '/select' | '/lobby') => void
}

export function createFightRuntime(app: HTMLElement, options: FightRuntimeOptions = {}) {
    const startingState = options.state ?? initial()
    document.title = 'Fight · Steel Fight Lab'
    const get = <E extends HTMLElement = HTMLElement>(id: string) => app.querySelector<E>('#' + id)!
    let showBoxes = false
    const boxToggle = app.querySelector<HTMLButtonElement>('#hitboxes')
    const setBoxes = (on: boolean) => {
        showBoxes = on
        if (!boxToggle) return
        boxToggle.setAttribute('aria-pressed', String(on))
        boxToggle.style.borderColor = on ? '#3dff9a' : ''
    }
    if (boxToggle) {
        boxToggle.onclick = () => setBoxes(!showBoxes)
        setBoxes(false)
    }
    const bindClick = (id: string, handler: () => void) => {
        const el = app.querySelector<HTMLElement>('#' + id)
        if (el) el.onclick = handler
    }
    bindClick('choose', () => {
        if (lobbySession.connection?.state) return
        lobbySession.setMode('local')
        options.navigate?.('/select')
    })
    bindClick('lobbyreturn', () => {
        if (lobbySession.connection) lobbySession.exit()
        options.navigate?.('/lobby')
    })
    get('victory-lobby').onclick = () => {
        if (network) return
        options.navigate?.('/lobby')
    }
    get('victory-rematch').onclick = () => {
        if (network || disposed) return
        rematchLocal()
    }
    const shortcuts = (e: KeyboardEvent) => {
        if (e.code === 'Escape') app.querySelector('.fight-app')?.classList.remove('obs-mode')
        if (e.code === 'F9') {
            e.preventDefault()
            app.querySelector<HTMLElement>('#moves')?.click()
        }
        if (e.code === 'F8' && boxToggle) {
            e.preventDefault()
            setBoxes(!showBoxes)
        }
    }
    window.addEventListener('keydown', shortcuts)
    const onlineState = lobbySession.connection?.state
    let selected = (onlineState ?? startingState).fighters[0].hero, state = onlineState ?? startingState, network = !!onlineState, room: any = lobbySession.room, connection = lobbySession.connection, disposed = false, generation = 0, raf = 0, last = 0, acc = 0, loaded = false, lastPing = 0, lastHud = 0
    const input = controls(), stage = get('stage'), scene = new T.Scene(), actors = new T.Scene(); scene.background = new T.Color('#100f14'); scene.add(new T.HemisphereLight(0xcce5ff, 0x54351e, 2)); const light = new T.DirectionalLight(0xffdec5, 3); light.position.set(0, 7, 10); scene.add(light); actors.add(light.clone(), new T.HemisphereLight(0xcce5ff, 0x54351e, 2)); actors.traverse(o => { if ((o as T.Light).isLight) o.layers.enable(1); o.layers.enable(FX_LAYER) })
    const camera = new T.PerspectiveCamera(38, 1, .1, 200); camera.position.set(0, 2.55, 13.2); camera.lookAt(0, 2.05, 0)
    // The original minigame also composes the arena and heroes as separate scene layers.
    // Keep the Game arena's authored framing; following heroes must not expose the map's cut edges.
    const sceneryCamera = camera.clone()
    const renderer = new T.WebGLRenderer({ antialias: true }); renderer.autoClear = false; renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75)); renderer.toneMapping = T.ACESFilmicToneMapping; stage.append(renderer.domElement)
    const shadows = [0, 1].map(() => { const shadow = new T.Mesh(new T.CircleGeometry(1.33, 48), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .3, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; shadow.scale.y = .4; shadow.position.y = .015; actors.add(shadow); return shadow })
    const boxes = hitboxDebug(); actors.add(boxes.root); tagFx(boxes.root)
    const outline = heroOutline(renderer)
    let models: Awaited<ReturnType<typeof loadFighter>>[] = []
    mountArena(scene).catch(e => { get('status').textContent = 'Arena failed: ' + e.message })
    async function fighters() { if (introPlayed) sfx.stop(); introPlayed = false; engaged = false; matchCalled = false; lastAction[0] = lastAction[1] = ''; hideVersus(); hideRoundCall(); hideVictory(); const gen = ++generation; loaded = false; if (!state.fighters.every(f => fighterStocked(f.hero, FIGHTER_PRESENCE))) get('announcement').textContent = 'LOADING FIGHTERS'; try { const next = await Promise.all(state.fighters.map(f => acquireFighter(f.hero, FIGHTER_PRESENCE))); if (disposed || gen !== generation) { next.forEach(releaseFighter); return } models.forEach(releaseFighter); models = next; models.forEach(m => { tagHero(m.root); actors.add(m.root) }); loaded = true; get('announcement').textContent = ''; const missing = next.flatMap(m => m.unmatched); get('status').textContent = missing.length ? `Accessories: ${missing.length} helper bones follow hierarchy (check)` : (network ? 'Online match • authoritative server' : 'Local fight • two controllers'); } catch (e) { get('announcement').textContent = 'LOAD FAILED'; get('status').textContent = String(e) } }
    function moveTable() {
        const h = roster[selected], actions = h.m_vecActionDefinitions
        const title = (id: string) => { const named = actions.flatMap((a: any) => a.m_vecCancelOptions ?? []).find((c: any) => c.m_nCancelActionID === id && c.m_strCancelActionName); return (labels as any)[named?.m_strCancelActionName] ?? String(actions.find((a: any) => a.m_nActionID === id)?.m_pszSequenceName ?? id).replace('fighting_', '').replaceAll('_', ' ') }
        const inputLabel = (value: string) => value.replaceAll('kBUTTON_FORWARD_BIT', '→').replaceAll('kBUTTON_BACK_BIT', '←').replaceAll('kBUTTON_UP_BIT', '↑').replaceAll('kBUTTON_DOWN_BIT', '↓').replaceAll('kBUTTON_ATTACK_BIT', 'A').replaceAll('kBUTTON_SPECIAL_BIT', 'S').replaceAll('|', ' + ')
        const rows = actions.flatMap((a: any) => (a.m_vecCancelOptions ?? []).map((c: any) => { const target = actions.find((t: any) => t.m_nActionID === c.m_nCancelActionID); const command = [c.m_eCancelInput, c.m_eCancelInput2, c.m_eCancelInput3].filter(Boolean).map(inputLabel).join(' , ') || 'Automatic'; const condition = (a.m_nActionID === 'IDLE_ACTION_DEFINITION' ? 'In neutral' : 'After ' + title(a.m_nActionID) + ' · ' + (c.m_nCancelStart ?? 0) + 'f') + (c.m_bRequiresInstall ? ' · buff active' : ''); return '<tr><td>' + escape(title(c.m_nCancelActionID)) + '<br><small>' + escape(condition) + '</small></td><td>' + escape(command) + '</td><td>' + (target?.m_nHitBoxStart ?? '—') + '</td><td>' + (target?.m_nOnBlockFrames ?? '—') + '</td><td>' + (target?.m_nOnHitFrames ?? '—') + '</td><td>' + (target?.m_flHitDamage ?? '—') + '</td></tr>' })).join('')
        get('movetable').innerHTML = '<h3>' + h.name + '</h3><p>A = attack · S = special · comma = command sequence</p><table><thead><tr><th>Move / condition</th><th>Command</th><th>Startup</th><th>Blockstun</th><th>Hitstun</th><th>Damage</th></tr></thead><tbody>' + rows + '</tbody></table>'
    }

    bindClick('moves', () => { moveTable(); get<HTMLDialogElement>('movelist').showModal() })
    bindClick('closemoves', () => get<HTMLDialogElement>('movelist').close())
    bindClick('obs', () => app.querySelector('.fight-app')?.classList.toggle('obs-mode'))
    const unsubscribeLobby = lobbySession.subscribe((snapshot, event) => {
        room = snapshot.room
        connection = snapshot.connection
        if (event === 'start' && snapshot.match) {
            network = true
            state = snapshot.match
            selected = state.fighters[0].hero
            void fighters()
        }
        if (event === 'resumed' && snapshot.match) {
            network = true
            state = snapshot.match
            if (connection?.state) state = connection.state
            models.forEach(model => model.resetMotion?.())
            get('status').textContent = 'Fight resumed'
            get('announcement').textContent = ''
        }
        if (event === 'paused') {
            get('status').textContent = snapshot.pauseMessage || 'Waiting for reconnect…'
            get('announcement').textContent = 'PAUSE · RECONNECT'
        }
        if (event === 'result') {
            get('status').textContent = snapshot.result
            get('announcement').textContent = ''
            window.setTimeout(() => { if (!disposed) options.navigate?.('/lobby') }, 1400)
        }
        if (event === 'error') get('status').textContent = snapshot.status
    })
    const resize = new ResizeObserver(() => { const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h); camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix(); sceneryCamera.aspect = camera.aspect; sceneryCamera.updateProjectionMatrix() }); resize.observe(stage)
    const impacts = hitSparks(); const swaps = netherSwapFx(); const unleashFx = marciUnleashFx(); const luminosityFx = dawnbreakerLuminosityFx()
    const sparks = new Map<string, HitSpark>(); const swapBursts = new Map<string, SwapBurst>(); const unleashBursts = new Map<string, UnleashBurst>(); const luminosityBursts = new Map<string, LuminosityBurst>()
    const unleashAuras: (UnleashAura | null)[] = [null, null]
    const seen = new Set<string>(); const pending: { id: string; kind: 'hit' | 'block' | 'swap' | 'install'; x: number; face: number; hero: string; action: string }[] = []; const effects = projectileEffects(); const projectiles = new Map<string, ProjectileVisual>()
    const lastAction = ['', '']
    let prevPause = 0, introPlayed = false, matchCalled = false, engaged = false
    function showVersus() {
        const panel = app.querySelector<HTMLElement>('#versus')
        if (!panel) return
        get('versus0').textContent = roster[state.fighters[0].hero].name.toUpperCase()
        get('versus1').textContent = roster[state.fighters[1].hero].name.toUpperCase()
        panel.classList.add('show')
        panel.setAttribute('aria-hidden', 'false')
    }
    function hideVersus() {
        const panel = app.querySelector<HTMLElement>('#versus')
        if (!panel) return
        panel.classList.remove('show')
        panel.setAttribute('aria-hidden', 'true')
    }
    function showVictory(winner: number) {
        const panel = app.querySelector<HTMLElement>('#victory')
        if (!panel) return
        hideVersus()
        hideRoundCall()
        get('victory-name').textContent = roster[state.fighters[winner].hero].name.toUpperCase()
        panel.classList.toggle('local', !network)
        panel.classList.add('show')
        panel.setAttribute('aria-hidden', 'false')
    }
    function hideVictory() {
        const panel = app.querySelector<HTMLElement>('#victory')
        if (!panel) return
        panel.classList.remove('show', 'local')
        panel.setAttribute('aria-hidden', 'true')
    }
    function roundLabel(finalRound: boolean) {
        if (finalRound) return 'FINAL ROUND'
        const next = state.pause > 0 ? state.round + 1 : state.round
        return `ROUND ${next}`
    }
    function showRoundCall(phase: 'round' | 'fight', finalRound: boolean) {
        const panel = app.querySelector<HTMLElement>('#roundcall')
        if (!panel) return
        hideVersus()
        get('announcement').textContent = ''
        get('roundcall-text').textContent = phase === 'fight' ? 'FIGHT!' : roundLabel(finalRound)
        panel.classList.toggle('fight', phase === 'fight')
        panel.classList.remove('show')
        void panel.offsetWidth
        panel.classList.add('show')
        panel.setAttribute('aria-hidden', 'false')
    }
    function hideRoundCall() {
        const panel = app.querySelector<HTMLElement>('#roundcall')
        if (!panel) return
        panel.classList.remove('show', 'fight')
        panel.setAttribute('aria-hidden', 'true')
    }
    function onRoundPhase(finalRound: boolean) {
        return (phase: 'round' | 'fight') => {
            if (disposed) return
            showRoundCall(phase, finalRound)
        }
    }
    function rematchLocal() {
        if (network || disposed) return
        const a = state.fighters[0].hero
        const b = state.fighters[1].hero
        const next = initial(a, b)
        Object.assign(state, next)
        prevPause = 0
        seen.clear()
        pending.length = 0
        for (const spark of sparks.values()) { actors.remove(spark.root); spark.dispose() }
        sparks.clear()
        for (const burst of swapBursts.values()) { actors.remove(burst.root); burst.dispose() }
        swapBursts.clear()
        for (const burst of unleashBursts.values()) { actors.remove(burst.root); burst.dispose() }
        unleashBursts.clear()
        for (const burst of luminosityBursts.values()) { actors.remove(burst.root); burst.dispose() }
        luminosityBursts.clear()
        for (let i = 0; i < 2; i++) {
            if (unleashAuras[i]) { actors.remove(unleashAuras[i]!.root); unleashAuras[i]!.dispose(); unleashAuras[i] = null }
        }
        for (const effect of projectiles.values()) { actors.remove(effect.root); effect.dispose() }
        projectiles.clear()
        void fighters()
    }
    function release() { if (disposed) return; engaged = true; hideVersus(); hideRoundCall(); if (state.pause > 0) state.pause = 1 }
    function cues() {
        state.fighters.forEach((f, i) => {
            if (f.action === lastAction[i]) return
            lastAction[i] = f.action
            if (!engaged) return
            sfx.swing(f.hero, f.action)
            if (f.action === 'SWAP_ACTION_DEFINITION') {
                const cast = swaps.create({ x: f.x / 300, y: 1.55 * FIGHTER_PRESENCE, z: 4.15 + .55 * FIGHTER_PRESENCE }, f.face, performance.now())
                cast.root.scale.setScalar(FIGHTER_PRESENCE * .85)
                tagFx(cast.root)
                actors.add(cast.root)
                swapBursts.set(`cast:${state.round}:${state.frame}:${i}`, cast)
            }
            if (f.action === 'UNLEASH_ACTION_DEFINITION' && f.hero === 'marci') {
                const cast = unleashFx.createCast({ x: f.x / 300, y: 1.55 * FIGHTER_PRESENCE, z: 4.15 + .55 * FIGHTER_PRESENCE }, f.face, performance.now())
                cast.root.scale.setScalar(FIGHTER_PRESENCE)
                tagFx(cast.root)
                actors.add(cast.root)
                unleashBursts.set(`cast:${state.round}:${state.frame}:${i}`, cast)
            }
            if (f.action === 'LUMINOSITY_ACTION_DEFINITION' && f.hero === 'dawnbreaker') {
                const cast = luminosityFx.create({ x: f.x / 300, y: 1.55 * FIGHTER_PRESENCE, z: 4.15 + .55 * FIGHTER_PRESENCE }, f.face, performance.now())
                cast.root.scale.setScalar(FIGHTER_PRESENCE)
                tagFx(cast.root)
                actors.add(cast.root)
                luminosityBursts.set(`cast:${state.round}:${state.frame}:${i}`, cast)
            }
        })
        if (!introPlayed && loaded) { introPlayed = true; engaged = false; hideVictory(); hideRoundCall(); showVersus(); sfx.intro(state.fighters[0].hero, state.fighters[1].hero, release, onRoundPhase(false)) }
        if (prevPause === 0 && state.pause > 0 && state.winner === null) { engaged = false; hideVersus(); const finalRound = state.score.some(n => n >= RULES.wins - 1); void sfx.roundOver(state.fighters.every(f => f.hp > 0)).then(() => sfx.roundCall(finalRound, onRoundPhase(finalRound))).then(release) }
        if (state.winner !== null && !matchCalled) { matchCalled = true; hideVersus(); hideRoundCall(); showVictory(state.winner); sfx.matchOver() }
        prevPause = state.pause
    }
    function takeHits() {
        for (const e of state.events ?? []) {
            if (seen.has(e.id)) continue
            seen.add(e.id)
            const kind = e.kind === 'block' ? 'block' : e.kind === 'swap' ? 'swap' : e.kind === 'install' ? 'install' : 'hit'
            pending.push({ id: e.id, kind, x: e.x, face: e.face ?? 1, hero: e.hero ?? state.fighters[0].hero, action: e.action ?? '' })
            // Nether Swap / Unleash install already cue their own cast audio.
            if (kind === 'swap' || kind === 'install' || e.action === 'SWAP_ACTION_DEFINITION' || e.action === 'LUMINOSITY_ACTION_DEFINITION' || e.action?.startsWith('STARBREAKER_')) continue
            sfx.impact(e.hero ?? state.fighters[0].hero, e.action ?? '', kind === 'block' ? 'block' : 'hit')
        }
    }
    function animate(time: number) {
        raf = requestAnimationFrame(animate); const renderDelta = Math.min((time - last) / 1000, .15); acc += renderDelta; last = time; if (time - lastPing > 2000) { connection?.send({ type: 'ping', at: Date.now() }); lastPing = time }
        while (acc >= 1 / 60) { acc -= 1 / 60; if (loaded) { const menu = !!get<HTMLDialogElement>('movelist').open; if (network && connection) { if (!lobbySession.paused) { connection.tick(input.read(0)); if (connection.state) state = connection.state } else if (connection.state) state = connection.state } else if (!menu) state = step(state, [input.read(0), input.read(1)], engaged ? 'play' : 'move'); if ((!menu && engaged) || network) takeHits(); cues() } }
        ;(scene.userData.tickArena as ((dt: number) => void) | undefined)?.(renderDelta)
        models.forEach((m, i) => m.update(state.fighters[i]))
        shadows.forEach((m, i) => m.position.set(state.fighters[i].x / 300, .015, 4.15))
        if (time - lastHud >= 50) {
            lastHud = time
            for (let i = 0; i < 2; i++) {
                const fighter = state.fighters[i]
                const ratio = fighter.hp / RULES.health
                const hp = get<HTMLElement>('hp' + i)
                const fill = hp.firstElementChild as HTMLElement
                fill.style.width = `${ratio * 100}%`
                fill.style.background = hpPaint(ratio)
                hp.setAttribute('aria-valuenow', String(fighter.hp))
                get<HTMLProgressElement>('guard' + i).value = fighter.guard
                const img = get<HTMLImageElement>('portrait' + i)
                const url = portrait(fighter.hero)
                if (!img.src.endsWith(url)) {
                    img.src = url
                    img.alt = roster[fighter.hero].name
                }
                get('combo' + i).textContent = fighter.combo > 1 ? fighter.combo + ' HITS' : ''
                get('round' + i).querySelectorAll('img').forEach((image, n) => image.classList.toggle('won', n < state.score[i]))
                get('shield' + i).classList.toggle('broken', fighter.guard <= 0)
                const player = network ? room?.people.find((person: any) => person.id === room.pair[i]) : null
                get('name' + i).textContent = (player ? player.nick + ' / ' : '') + roster[fighter.hero].name
            }
            get('timer').textContent = String(Math.ceil(state.remaining / 60)).padStart(2, '0')
            get('round').textContent = 'ROUND ' + String(state.round).padStart(2, '0')
            if (loaded) {
                if (lobbySession.paused) get('announcement').textContent = 'PAUSE · RECONNECT'
                else get('announcement').textContent = state.winner !== null ? '' : state.pause ? 'ROUND OVER' : ''
            }        }
        for (const e of pending) {
            const y = 1.55 * FIGHTER_PRESENCE
            const z = 4.15 + .55 * FIGHTER_PRESENCE
            if (e.kind === 'swap') {
                const burst = swaps.create({ x: e.x / 300, y, z }, e.face, time)
                burst.root.scale.setScalar(FIGHTER_PRESENCE)
                tagFx(burst.root)
                actors.add(burst.root)
                swapBursts.set(e.id, burst)
            } else if (e.kind === 'install' && e.hero === 'marci') {
                const burst = unleashFx.createCast({ x: e.x / 300, y, z }, e.face, time)
                burst.root.scale.setScalar(FIGHTER_PRESENCE * 1.1)
                tagFx(burst.root)
                actors.add(burst.root)
                unleashBursts.set(e.id, burst)
                const slot = state.fighters.findIndex(f => Math.abs(f.x - e.x) < 1 && f.hero === 'marci')
                const i = slot >= 0 ? slot : (Math.abs(state.fighters[0].x - e.x) <= Math.abs(state.fighters[1].x - e.x) ? 0 : 1)
                if (!unleashAuras[i]) {
                    const aura = unleashFx.createAura()
                    tagFx(aura.root)
                    actors.add(aura.root)
                    unleashAuras[i] = aura
                }
            } else if (e.kind === 'hit' || e.kind === 'block') {
                const i = Math.abs(state.fighters[0].x - e.x) <= Math.abs(state.fighters[1].x - e.x) ? 0 : 1
                const origin = models[i]?.root.position
                const at = origin ? { x: origin.x, y: origin.y + y, z: origin.z + .55 * FIGHTER_PRESENCE } : { x: e.x / 300, y, z }
                if (e.kind === 'hit' && e.action === 'LUMINOSITY_ACTION_DEFINITION' && e.hero === 'dawnbreaker') {
                    const burst = luminosityFx.create(at, e.face, time)
                    burst.root.scale.setScalar(FIGHTER_PRESENCE * 1.15)
                    tagFx(burst.root)
                    actors.add(burst.root)
                    luminosityBursts.set(`hit:${e.id}`, burst)
                }
                const spark = impacts.create(e.kind, at, e.face, time)
                spark.root.scale.setScalar(FIGHTER_PRESENCE)
                tagFx(spark.root)
                actors.add(spark.root)
                sparks.set(e.id, spark)
            }
        }
        pending.length = 0
        for (const [id, spark] of sparks) if (!spark.update(time)) { actors.remove(spark.root); spark.dispose(); sparks.delete(id) }
        for (const [id, burst] of swapBursts) if (!burst.update(time)) { actors.remove(burst.root); burst.dispose(); swapBursts.delete(id) }
        for (const [id, burst] of unleashBursts) if (!burst.update(time)) { actors.remove(burst.root); burst.dispose(); unleashBursts.delete(id) }
        for (const [id, burst] of luminosityBursts) if (!burst.update(time)) { actors.remove(burst.root); burst.dispose(); luminosityBursts.delete(id) }
        for (let i = 0; i < 2; i++) {
            const aura = unleashAuras[i]
            const f = state.fighters[i]
            if (aura && (!f.install || f.hero !== 'marci')) {
                actors.remove(aura.root); aura.dispose(); unleashAuras[i] = null
            } else if (aura && f.install) {
                const origin = models[i]?.root.position
                aura.update(origin?.x ?? f.x / 300, (origin?.y ?? 0) + 1.35 * FIGHTER_PRESENCE, origin?.z ?? 4.15, time)
            }
        }
        if (seen.size > 4096) seen.clear()
        for (const p of state.projectiles) { let effect = projectiles.get(p.id); if (!effect) { effect = effects.create(state.fighters[p.owner].hero, state.frame); effect.root.scale.setScalar(FIGHTER_PRESENCE); tagFx(effect.root); actors.add(effect.root); projectiles.set(p.id, effect) } effect.update(p.x, p.face, state.frame) }
        for (const [id, mesh] of projectiles) if (!state.projectiles.some(p => p.id === id)) { actors.remove(mesh.root); mesh.dispose(); projectiles.delete(id) }
        boxes.update(state, showBoxes)
        frameFight(camera)
        const sceneryPan = 0
        sceneryCamera.position.x = sceneryPan; sceneryCamera.lookAt(sceneryPan, 2.05, 0)
        renderer.clear(); renderer.render(scene, sceneryCamera); renderer.clearDepth(); camera.layers.set(0); renderer.render(actors, camera); outline.draw(actors, camera); camera.layers.set(FX_LAYER); renderer.clearDepth(); renderer.render(actors, camera); camera.layers.set(0)
    }
    void fighters(); raf = requestAnimationFrame(animate)
    return () => {
        disposed = true; sfx.stop(); unsubscribeLobby(); window.removeEventListener('keydown', shortcuts); cancelAnimationFrame(raf); resize.disconnect(); input.dispose()
        models.forEach(releaseFighter)
        for (const spark of sparks.values()) spark.dispose(); impacts.dispose()
        for (const burst of swapBursts.values()) burst.dispose(); swaps.dispose()
        for (const burst of unleashBursts.values()) burst.dispose()
        for (const aura of unleashAuras) aura?.dispose()
        unleashFx.dispose()
        for (const burst of luminosityBursts.values()) burst.dispose()
        luminosityFx.dispose()
        for (const effect of projectiles.values()) effect.dispose(); effects.dispose(); boxes.dispose(); outline.dispose(); renderer.dispose()
    }
}


