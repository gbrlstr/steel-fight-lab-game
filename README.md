# Steel Fight Lab

<p align="center">
  <img src="./app/assets/menu/steelfightlab_logo.png" alt="Steel Fight Lab" width="520">
</p>

<p align="center">
  <a href="https://github.com/gbrlstr/steel-fight-lab-game/releases"><img src="https://img.shields.io/badge/version-0.0.1-d2ac5d?style=flat-square" alt="Version 0.0.1"></a>
  <a href="./LICENSE.md"><img src="https://img.shields.io/badge/license-MIT-2ea44f?style=flat-square" alt="MIT License"></a>
  <a href="https://github.com/gbrlstr/steel-fight-lab-game/issues"><img src="https://img.shields.io/github/issues/gbrlstr/steel-fight-lab-game?style=flat-square" alt="Open issues"></a>
  <a href="https://github.com/gbrlstr/steel-fight-lab-game/stargazers"><img src="https://img.shields.io/github/stars/gbrlstr/steel-fight-lab-game?style=flat-square" alt="GitHub stars"></a>
  <a href="https://github.com/gbrlstr/steel-fight-lab-game/network/members"><img src="https://img.shields.io/github/forks/gbrlstr/steel-fight-lab-game?style=flat-square" alt="GitHub forks"></a>
  <img src="https://img.shields.io/github/languages/top/gbrlstr/steel-fight-lab-game?style=flat-square" alt="Top language">
  <img src="https://img.shields.io/github/last-commit/gbrlstr/steel-fight-lab-game?style=flat-square" alt="Last commit">
</p>

Browser-based 1v1 fighting client with online rooms, tournament brackets, and 3D rendering.

Independent prototype inspired by arena fighting mechanics. **Not an official Valve product** and does not claim full fidelity to Sleet Fighter / Dota 2.

| | |
| --- | --- |
| **Version** | `0.0.1` ([package.json](./package.json)) |
| **Stack** | Nuxt 4 · Vue 3 · Pinia · Tailwind CSS 4 · Three.js · TypeScript |
| **Multiplayer** | WebSocket + client-side rollback · authority on **sleet-fighter-server** |
| **Issues** | [github.com/gbrlstr/steel-fight-lab-game/issues](https://github.com/gbrlstr/steel-fight-lab-game/issues) |
| **License** | [MIT](./LICENSE.md) (code). Valve assets are **not** included in the license. |

---

## Project statistics

| Metric | Value |
| --- | --- |
| **Client version** | `0.0.1` |
| **Repository** | [gbrlstr/steel-fight-lab-game](https://github.com/gbrlstr/steel-fight-lab-game) |
| **Default branch** | `master` |
| **Playable heroes** | 5 (Tusk, Bristleback, Shendelzare, Marci, Dawnbreaker) |
| **Main routes** | `/` · `/lobby` · `/select` · `/fight` |
| **Source footprint** | ~82 app/source files · ~23k lines (excl. `node_modules`, assets, builds) |
| **GitHub** | [Stars](https://github.com/gbrlstr/steel-fight-lab-game/stargazers) · [Forks](https://github.com/gbrlstr/steel-fight-lab-game/network/members) · [Issues](https://github.com/gbrlstr/steel-fight-lab-game/issues) · [PRs](https://github.com/gbrlstr/steel-fight-lab-game/pulls) |

Live counters (stars, forks, open issues, last commit) update automatically via the badges above.

---

## Issues

Bug reports, feature requests, and netcode/UX notes go in **GitHub Issues**:

- **Open an issue:** [New issue](https://github.com/gbrlstr/steel-fight-lab-game/issues/new)
- **Browse open issues:** [All issues](https://github.com/gbrlstr/steel-fight-lab-game/issues)
- **Labels to prefer:** `bug`, `enhancement`, `docs`, `netcode`, `assets` (when available)

Please include OS/browser, local vs online, and steps to reproduce. **Do not** attach Valve VPKs or proprietary asset dumps.

Companion server issues: [sleet-fighter-server](https://github.com/gbrlstr/steel-fight-lab-server/issues).

---

## Overview

- Lobby with public rooms, join codes, and host role
- Fighter select, queue, call-up, and brackets (2 / 4 / 8 / 16 / 32)
- Matches with local prediction, authoritative snapshots, and ~30s reconnect (F5 / drop)
- Spectators with a short view delay
- Keyboard + gamepad; forward/back relative to fighter facing

```
/  →  /lobby  →  /select  →  /fight
```

Internal tools: `/dev/game`, `/dev/debug`.

---

## Requirements

- **Node.js 24+**
- Multiplayer backend: **sleet-fighter-server** (recommended) or the built-in mock
- Local 3D assets under `public/fighters` (see [Assets & legal](#assets--legal))

---

## Get started in 5 minutes

```bash
# Terminal 1 — backend (NestJS)
cd ../sleet-fighter-server
npm install
npm run start:dev

# Terminal 2 — client
cd ../dota-model-viewer
npm install
npm run dev -- --port 5174
```

Open [http://127.0.0.1:5174/](http://127.0.0.1:5174/).

### Local mock only (no NestJS)

```bash
npm install
npm run mock:server   # ws://127.0.0.1:3001
npm run dev -- --port 5174
```

The mock is for quick development. For rooms, pause/reconnect, and the HTTP API, use the NestJS server.

---

## Configuration

Public Nuxt / environment variables:

| Variable | Default | Description |
| --- | --- | --- |
| `NUXT_PUBLIC_WS_URL` | `ws://127.0.0.1:3001` | Multiplayer WebSocket endpoint |
| `NUXT_PUBLIC_API_URL` | `http://127.0.0.1:3010` | HTTP API (room list, health) |
| `NUXT_PUBLIC_GITHUB_URL` | `https://github.com/gbrlstr/steel-fight-lab-game` | Title-screen GitHub banner link |

**Production (Vercel client):** the frontend alone cannot host rooms. Deploy **sleet-fighter-server** on a **always-on** host with WebSockets (**Railway / Render / Fly / VPS** — not Vercel). Then set both env vars in the Vercel project **before build**:

```bash
NUXT_PUBLIC_API_URL=https://your-server.up.railway.app
NUXT_PUBLIC_WS_URL=wss://your-server.up.railway.app
```

Same host/port is fine: the Nest process serves `/rooms` (HTTP) and upgrades WebSocket on the same origin. If these stay on `127.0.0.1` or a Vercel “server” URL, OPEN ROOMS stays empty and Create/Join cannot reach the backend.

### Deploy server (Railway example)

1. New Railway project → deploy `sleet-fighter-server` (build: `npm run build`, start: `npm run start:prod`)
2. Do **not** set `HTTP_PORT` on Railway (it uses the single `PORT` Railway injects)
3. Copy the public HTTPS URL into the client env vars above and redeploy Vercel

In `nuxt.config.ts`:

```ts
runtimeConfig: {
  public: {
    wsUrl: 'ws://127.0.0.1:3001',
    apiUrl: 'http://127.0.0.1:3010',
  },
}
```

---

## Controls

| Action | Player 1 | Player 2 | Gamepad |
| --- | --- | --- | --- |
| Move | `W` `A` `S` `D` | Arrow keys | D-pad / stick |
| Attack | `Space` | `Enter` | Button 0 / A |
| Special | Left `Alt` | Right `Shift` | Button 1 / B |
| Block | `A` + `S` + `D` (forward + down + back) | Equivalent arrows | Equivalent chord |

Forward/back follow fighter facing. Relative commands and sequences come from the imported moveset.

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Nuxt development server |
| `npm run build` | Production build |
| `npm run preview` | Preview the build |
| `npm run typecheck` | Type checking |
| `npm test` | Simulation + network integration (3 clients) |
| `npm run mock:server` | Local WebSocket mock |
| `npm run import:data` | Import combat data from KV3 |
| `npm run import:assets` | Asset pipeline (Source2Viewer CLI) |
| `npm run validate:assets` | Audit GLBs and dependencies |
| `node tools/optimize-glb.mjs` | Strip unused animations under `public/fighters` |

---

## Architecture (summary)

```
app/
  game/shared/combat.ts   # fight rules (mirrored on the server)
  game/net/client.ts      # WebSocket, prediction, and rollback
  game/render/            # Three.js, fighters, camera
  pages/                  # Nuxt routes (lobby, select, fight)
  stores/                 # Pinia (session, room)
docs/                     # networking, validation, movesets
server/index.mjs          # multiplayer mock
tests/                    # automated tests
```

Protocol & authority: [`docs/network.md`](./docs/network.md) · validation: [`docs/validation.md`](./docs/validation.md).

The **server** is the sole authority over HP, authoritative position, and match outcome. The client only sends boolean input masks — never damage or a winner.

---

## Contributing

Contributions are welcome — issues, fixes, netcode/UX improvements, and docs.

1. Fork and create a descriptive branch (`fix/…`, `feat/…`, `docs/…`)
2. Keep changes focused; avoid unrelated refactors
3. Run `npm run typecheck` and `npm test` before opening a PR
4. Describe the problem, the solution, and how to test
5. **Do not** include Valve assets, VPKs, or builds with proprietary content in PRs

Good ideas: visual interpolation after corrections, hit audio, packet-loss network tests, lobby accessibility, CI.

---

## Assets & legal

- Code and docs: [MIT](./LICENSE.md)
- Full attribution: [CREDITS.md](./CREDITS.md)
- *Dota 2* models, textures, animations, maps, UI art, and related media belong to **Valve Corporation**
- Steel Fight Lab does **not** claim ownership of those assets
- Use local exports for development only; **do not redistribute** the VPK or builds with Valve assets
- Local inventory sources: `docs/vpk-inventory.txt`, `imports/original`, manifests under `docs/`

This project does **not** claim full equivalence to official Sleet Fighter. Read `docs/validation.md` before treating the prototype as a fidelity reference.

---

## Related repositories

| Repository | Role |
| --- | --- |
| **[steel-fight-lab-game](https://github.com/gbrlstr/steel-fight-lab-game)** (this) | Nuxt client + render + prediction |
| **[sleet-fighter-server](https://github.com/gbrlstr/steel-fight-lab-server)** | Authoritative NestJS backend |

---

## License

[MIT](./LICENSE.md) — Copyright © 2026 Steel Fight Lab Contributors.
