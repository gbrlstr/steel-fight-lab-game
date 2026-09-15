import * as THREE from 'three'
import { loadGltf } from './asset-cache'
const arenaGlbUrl = '/arena/arena-scene.glb'
import { fitModelToGround, loadTuskarModel } from '../lab/tuskar'
import { attachArenaCrowd } from './arena-crowd'

/** Texturas em qualquer subpasta de maps (GLBs externos referenciam PNGs pelo nome do arquivo). */
const arenaTextureUrls = import.meta.glob<string>(
  '../../assets/maps/**/*.{png,jpg,jpeg,webp,tga}',
  {
    eager: true,
    import: 'default',
    query: '?url',
  },
)

/** Busca por basename (case-insensitive) — o GLB pode referenciar só o nome sem path. */
const arenaTextureUrlByBasename = new Map<string, string>()
for (const [path, url] of Object.entries(arenaTextureUrls)) {
  const base = path.replace(/^.*[/\\]/, '').toLowerCase()
  arenaTextureUrlByBasename.set(base, url)
}

/** PNG opcionais em `materials/` — não sobrepõe basename já vindo de `maps/`. */
const materialsTextureUrls = import.meta.glob<string>(
  '../../assets/materials/**/*.{png,jpg,jpeg,webp,tga}',
  {
    eager: true,
    import: 'default',
    query: '?url',
  },
)
for (const [path, url] of Object.entries(materialsTextureUrls)) {
  const base = path.replace(/^.*[/\\]/, '').toLowerCase()
  if (!arenaTextureUrlByBasename.has(base)) {
    arenaTextureUrlByBasename.set(base, url)
  }
}

/**
 * Texturas do pacote arena (`fog_*`, `water_*`, `fow_*`, etc.) — pasta canónica no repo.
 * Sobrepõe qualquer basename igual em outro ramo de `maps/` ou `materials/`.
 */
const arenaSceneFolderTextureUrls = import.meta.glob<string>(
  '../../assets/maps/scenes/crownfall/arena/**/*.{png,jpg,jpeg,webp,tga}',
  {
    eager: true,
    import: 'default',
    query: '?url',
  },
)
for (const [path, url] of Object.entries(arenaSceneFolderTextureUrls)) {
  const base = path.replace(/^.*[/\\]/, '').toLowerCase()
  arenaTextureUrlByBasename.set(base, url)
}

/**
 * GLB renderizavel do palco. Evita `import.meta.glob(..., eager)` nos GLBs porque o Vite tambem copia
 * physics/world/effects filtrados em runtime, aumentando o build e atrasando o carregamento da cena.
 */
const arenaGlbEntries: Array<{ path: string; url: string }> = [
  { path: 'public/arena/arena-scene.glb', url: arenaGlbUrl },
  // { path: '../assets/maps/scenes/crownfall/arena_fg/world.glb', url: arenaFgGlbUrl },
]

/**
 * Export GLB do nó `maps/scenes/crownfall/arena/worldnodes/node000` (`world_layer_base`).
 * Node Data (aggregate): `node000_prop0_lr0_agg0_1_tusktown01` + mesh cubemap `*_primary_black` (não renderizar no viewer).
 */
const arenaScale = 0.245
const arenaFrontRotationY = -Math.PI * 1.4
const playerScale = 0.44
/** Ligeiramente mais próximo da câmera que o tablado para ficar à frente das camadas de névoa no fundo. */
const playerDepth = 4.15

/** Névoa global suave — combinada com planos no fundo (não empastar o palco). */
function applyGameAtmosphere(scene: THREE.Scene) {
  scene.fog = new THREE.FogExp2(0x18141c, 0.011)
}

export function mountGamePage(app: HTMLElement) {
  app.innerHTML = `
    <nav class="topbar">
      <a class="brand" href="#debug">Steel Fight Lab</a>
      <div class="tabs">
        <a href="#debug">Debug</a>
        <a class="active" href="#game">Game</a>
      </div>
    </nav>
    <main class="viewport-page">
      <div class="viewport" data-view></div>
      <!--<aside class="panel">
        <h1>Cenario 2D</h1>
        <p>Pack arena: minifight_tavern, tusktown01, tuss_tav*, tuskhouse01, tuskfolk/pingüim, fog maps, luz dinâmica. A/D: lateral.</p>
      </aside>-->
    </main>
  `

  const view = app.querySelector<HTMLDivElement>('[data-view]')

  if (!view) {
    throw new Error('Game viewport container not found')
  }

  const viewport = view
  const scene = new THREE.Scene()
  const playerScene = new THREE.Scene()
  scene.background = new THREE.Color(0x000000)

  const camera = createGameCamera(viewport)
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.autoClear = false
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(viewport.clientWidth, viewport.clientHeight)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.setClearColor(0x000000, 1)
  viewport.appendChild(renderer.domElement)

  applyGameAtmosphere(scene)

  /** Pools quentes (lareira/balcão) vs frio nas janelas do fundo — como color correction + lights no editor. */
  scene.add(new THREE.AmbientLight(0xffe8d4, 0.48))

  const fireKey = new THREE.DirectionalLight(0xffc9a0, 1.45)
  fireKey.position.set(-2.2, 5.8, 6.8)
  scene.add(fireKey)

  const coolRim = new THREE.DirectionalLight(0xc5ddff, 0.55)
  coolRim.position.set(2.0, 4.5, -8.5)
  scene.add(coolRim)

  const fillLight = new THREE.HemisphereLight(0x9ec0f0, 0x352818, 0.62)
  scene.add(fillLight)
  addPlayerSceneLights(playerScene)

  loadArenaStage(scene).catch((error: unknown) => {
    console.error('Erro ao carregar arena.glb, usando cenario fallback:', error)
    createSimple2DStage(scene)
  })

  const timer = new THREE.Timer()
  timer.connect(document)
  const actions: Record<string, THREE.AnimationAction> = {}
  const keys = {
    left: false,
    right: false,
  }

  let mixer: THREE.AnimationMixer | null = null
  let player: THREE.Object3D | null = null
  let currentAction: THREE.AnimationAction | null = null
  let currentActionName: string | null = null
  let animationFrameId = 0
  let disposed = false

  loadTuskarModel()
    .then(({ model, animations }) => {
      if (disposed) return

      model.rotation.y = Math.PI / 2
      model.position.set(7.0, 0, playerDepth)
      model.scale.setScalar(playerScale)
      fitModelToGround(model)
      preparePlayerForArenaPlane(model)
      removeExistingPlayer(playerScene)
      model.name = 'playerTuskar'
      playerScene.add(model)
      player = model

      mixer = new THREE.AnimationMixer(model)

      for (const clip of animations) {
        actions[clip.name] = mixer.clipAction(clip)
      }

      if (actions.run) {
        actions.run.timeScale = 0.75
      }

      playAnimation('idle')
    })
    .catch((error: unknown) => {
      console.error('Erro ao carregar Tusk no cenario do game:', error)
    })

  function animate(timestamp?: number) {
    animationFrameId = requestAnimationFrame(animate)

    timer.update(timestamp)
    const delta = timer.getDelta()

    if (mixer) {
      mixer.update(delta)
    }

    updatePlayerMovement(delta)
    pulseArenaCampfireLights(scene, timestamp)
    scrollArenaAtmosphereMaps(scene, delta)
    ;(scene.userData.tickArena as ((dt: number) => void) | undefined)?.(delta)

    renderer.clear()
    renderer.render(scene, camera)
    renderer.clearDepth()
    renderer.render(playerScene, camera)
  }

  function playAnimation(name: string, fadeDuration = 0.16) {
    const nextAction = actions[name]

    if (!nextAction || currentActionName === name) return

    nextAction.reset().fadeIn(fadeDuration).play()

    if (currentAction) {
      currentAction.fadeOut(fadeDuration)
    }

    currentAction = nextAction
    currentActionName = name
  }

  function updatePlayerMovement(delta: number) {
    if (!player) return

    const direction = Number(keys.right) - Number(keys.left)

    if (direction === 0) {
      playAnimation('idle')
      return
    }

    playAnimation('run')

    player.position.x = THREE.MathUtils.clamp(player.position.x + direction * 3.2 * delta, -4.8, 4.8)

    player.rotation.y = direction > 0 ? Math.PI / 2 : -Math.PI / 2
  }

  function handleResize() {
    updateGameCamera(camera, viewport)
    renderer.setSize(viewport.clientWidth, viewport.clientHeight)
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.code === 'KeyA' || event.code === 'ArrowLeft') keys.left = true
    if (event.code === 'KeyD' || event.code === 'ArrowRight') keys.right = true
  }

  function handleKeyUp(event: KeyboardEvent) {
    if (event.code === 'KeyA' || event.code === 'ArrowLeft') keys.left = false
    if (event.code === 'KeyD' || event.code === 'ArrowRight') keys.right = false
  }

  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  animate()

  return () => {
    disposed = true
    cancelAnimationFrame(animationFrameId)
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
    timer.dispose()
    renderer.dispose()
  }
}

function createGameCamera(view: HTMLElement) {
  const camera = new THREE.PerspectiveCamera(38, getAspect(view), 0.1, 80)

  /** Enquadramento lateral com vigas/lampiões visíveis (referência Hammer side-view). */
  camera.position.set(0, 2.55, 13.2)
  camera.lookAt(0, 2.05, 0)
  updateGameCamera(camera, view)

  return camera
}

function updateGameCamera(camera: THREE.PerspectiveCamera, view: HTMLElement) {
  camera.aspect = getAspect(view)
  camera.updateProjectionMatrix()
}

function getAspect(element: HTMLElement) {
  return element.clientWidth / Math.max(element.clientHeight, 1)
}

/**
 * Ordem de composição: clear/fog → GLBs `arena` → `arena_fg` (tuss_tav*) → planos névoa PNG atrás do palco →
 * personagem → FogExp2. (`fg_effects_layer.glb` não é carregado — proxies enormes no Three.js.)
 */
function addPlayerSceneLights(scene: THREE.Scene) {
  scene.add(new THREE.AmbientLight(0xffe8d4, 0.62))

  const key = new THREE.DirectionalLight(0xffd6b8, 1.65)
  key.position.set(-2.5, 5, 5.5)
  scene.add(key)

  const rim = new THREE.DirectionalLight(0xc8dcff, 0.72)
  rim.position.set(3, 3.8, -4)
  scene.add(rim)
}

function preparePlayerForArenaPlane(model: THREE.Object3D) {
  model.renderOrder = 20

  model.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return

    const mesh = child as THREE.Mesh
    mesh.renderOrder = 20
    mesh.frustumCulled = false
    mesh.castShadow = true
    mesh.receiveShadow = false

    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]

    for (const material of materials) {
      if (!material) continue

      material.depthTest = true
      material.depthWrite = true
      material.needsUpdate = true
    }
  })
}

function removeExistingPlayer(scene: THREE.Scene) {
  const existing = scene.getObjectByName('playerTuskar')

  if (existing) {
    existing.removeFromParent()
  }
}

function arenaGlbSortKey(filePath: string): number {
  const lower = filePath.replaceAll('\\', '/').toLowerCase()

  if (lower.includes('fg_effects_layer') || lower.includes('effects_layer')) return 20
  if (lower.includes('arena_fg')) return 10
  if (/[/\\]arena\.glb$/i.test(lower) || lower.endsWith('/arena.glb')) return 0

  return 5
}

function isRenderableArenaGlb(filePath: string): boolean {
  const lower = filePath.replaceAll('\\', '/').toLowerCase()

  if (lower.includes('physics')) return false
  if (lower.includes('collision')) return false
  if (lower.includes('_nav')) return false
  /** Export `world.glb` do subnó do mapa costuma vir com origem diferente e quebra o palco no Three.js. */
  /**
   * Camada de efeitos do Source: volumes/partículas como meshes gigantes sem pipeline .vpcf —
   * cobre o personagem e o tablado no WebGL.
   */
  if (lower.includes('fg_effects_layer')) return false

  return true
}

function getSortedArenaGlbEntries(): Array<{ path: string; url: string }> {
  return arenaGlbEntries
    .filter(({ path }) => isRenderableArenaGlb(path))
    .sort((a, b) => arenaGlbSortKey(a.path) - arenaGlbSortKey(b.path) || a.path.localeCompare(b.path))
}

export function arenaTextureManager() {
  const manager = new THREE.LoadingManager()
  manager.onError = (url) => {
    console.warn('Falha ao carregar recurso da arena:', url)
  }
  manager.setURLModifier((url) => resolveArenaTextureUrl(url))
  return manager
}

function resolveArenaTextureUrl(rawUrl: string): string {
  let path = rawUrl.replaceAll('\\', '/')

  try {
    path = decodeURIComponent(path)
  } catch {
    /* ignore */
  }

  const query = path.indexOf('?')
  if (query >= 0) path = path.slice(0, query)
  const hash = path.indexOf('#')
  if (hash >= 0) path = path.slice(0, hash)

  const segment = path.split('/').pop()
  if (!segment) return rawUrl

  const key = segment.toLowerCase()
  return arenaTextureUrlByBasename.get(key) ?? rawUrl
}

let arenaStage: THREE.Group | null = null
let arenaJob: Promise<THREE.Group> | null = null

function rememberArena(scene: THREE.Scene, stage: THREE.Object3D) {
  const tick = stage.userData.tickArena as ((dt: number) => void) | undefined
  if (tick) scene.userData.tickArena = tick
  if (stage.userData.atmosphereUvScrollTextures) scene.userData.atmosphereUvScrollTextures = stage.userData.atmosphereUvScrollTextures
  if (stage.userData.arenaHearthPulse) scene.userData.arenaHearthPulse = stage.userData.arenaHearthPulse
}

export function prepareArena() {
  if (arenaStage) return Promise.resolve(arenaStage)
  if (!arenaJob) arenaJob = buildArena().then(stage => {
    arenaStage = stage
    return stage
  }, error => {
    arenaJob = null
    throw error
  })
  return arenaJob
}

export function mountArena(scene: THREE.Scene) {
  return prepareArena().then(stage => {
    stage.removeFromParent()
    scene.add(stage)
    rememberArena(scene, stage)
  })
}

export function loadArenaStage(scene: THREE.Scene) {
  return mountArena(scene)
}

async function buildArena() {
  const scene = new THREE.Scene()
  const loadEntries = getSortedArenaGlbEntries()
  const manager = arenaTextureManager()
  const layers = await Promise.all(
    loadEntries.map(async ({ path, url }) => {
      const gltf = await loadGltf(url, manager)
      // O mapa tem SkinnedMesh sem skeleton. Clonar quebra em skeleton.bones;
      // há uma só instância, então a cena em cache é reparentada na luta.
      const root = gltf.scene
      root.name = path.replace(/^.*[/\\]/, '').replace(/\.glb$/i, '')
      return root
    }),
  )
    const stageRoot = new THREE.Group()
    stageRoot.name = 'arenaStage'

    for (const layer of layers) {
      stageRoot.add(layer)
    }

    if (!prepareArenaForGameView(stageRoot)) {
      throw new Error('arena.glb carregou, mas nenhum mesh de cenario ficou visivel.')
    }

    stripInvalidArenaTextures(stageRoot)

    const bounds = getGeometryBounds(stageRoot)
    console.info('Arena carregada:', {
      glbLayers: loadEntries.map((e) => e.path),
      meshes: countVisibleMeshes(stageRoot),
      min: bounds.min.toArray(),
      max: bounds.max.toArray(),
    })

    /** Ordem no grafo = ordem de render de cada GLB (transparências permitem empilhar FG/FX por cima). */
    scene.add(stageRoot)
    await attachArenaCrowd(stageRoot, scene)
    stageRoot.userData.tickArena = scene.userData.tickArena
    addArenaAccentLights(scene, stageRoot)
    attachArenaAtmosphereLayers(scene, stageRoot)
    return stageRoot
}

type ArenaAtmosphereLayerSpec = {
  basename: string
  opacity: number
  /** Deslocamento em profundidade (vertical stack). */
  zBias: number
  additive?: boolean
  plane: 'vertical' | 'floor'
  /** Scroll da UV (texturas de fluxo). */
  uvScroll?: { x: number; y: number }
}

/** Opacidades baixas: planos ficam só atrás da geometria (ver `attachArenaAtmosphereLayers`). */
const ARENA_ATMOSPHERE_LAYER_SPECS: ArenaAtmosphereLayerSpec[] = [
  { basename: 'fog_flow_map.png', opacity: 0.09, zBias: 0, additive: true, plane: 'vertical', uvScroll: { x: 0.012, y: 0.018 } },
  { basename: 'fog_opacity_map.png', opacity: 0.07, zBias: 0.04, plane: 'vertical' },
  { basename: 'water_flow_map.png', opacity: 0.06, zBias: 0.08, plane: 'floor', uvScroll: { x: 0.055, y: 0 } },
  { basename: 'fow_clouds_00.png', opacity: 0.06, zBias: 0.02, additive: true, plane: 'vertical', uvScroll: { x: 0.008, y: 0.01 } },
  { basename: 'fow_drifts_00.png', opacity: 0.05, zBias: 0.06, plane: 'vertical', uvScroll: { x: 0, y: 0.014 } },
]

/** Aproxima `healing_campfire_flame_a.vpcf` / chamas — intensidade da luz da lareira (Three não lê .vpcf). */
function pulseArenaCampfireLights(scene: THREE.Scene, timestamp?: number) {
  const t = timestamp ?? 0
  const hearth = scene.userData.arenaHearthPulse as THREE.PointLight | undefined

  if (hearth) {
    hearth.intensity = 1.05 + Math.sin(t * 0.007) * 0.15 + (Math.random() - 0.5) * 0.07
  }
}

function scrollArenaAtmosphereMaps(scene: THREE.Scene, delta: number) {
  const entries = scene.userData.atmosphereUvScrollTextures as
    | Array<{ texture: THREE.Texture; vx: number; vy: number }>
    | undefined

  if (!entries || delta <= 0) return

  for (const { texture, vx, vy } of entries) {
    texture.offset.x += delta * vx
    texture.offset.y += delta * vy
  }
}

/**
 * Planos de névoa **atrás** da taverna (eixo Z: câmera em +Z olha para Z menores).
 * Antes usávamos `center.z + fração do size`, o que punha os quadrados à frente do lutador e tapava tudo.
 */
function attachArenaAtmosphereLayers(scene: THREE.Scene, stageRoot: THREE.Object3D) {
  const loader = new THREE.TextureLoader()

  stageRoot.updateWorldMatrix(true, true)

  const bounds = getGeometryBounds(stageRoot)

  if (bounds.isEmpty()) return

  const center = bounds.getCenter(new THREE.Vector3())
  const size = bounds.getSize(new THREE.Vector3())
  /** Mais afastado da câmera (+Z): fundo da caixa do palco. */
  const zBackdrop = bounds.min.z - 0.35
  const planeW = Math.min(Math.max(size.x * 1.05, 14), 28)
  const planeH = Math.min(Math.max(size.y * 1.06, 8), 15)
  const floorDepth = Math.min(Math.max(size.z * 1.08, 6), 14)

  const loadTex = (url: string) =>
    new Promise<THREE.Texture>((resolve, reject) => {
      loader.load(url, resolve, undefined, reject)
    })

  const uvScrollList: Array<{ texture: THREE.Texture; vx: number; vy: number }> = []

  const loads = ARENA_ATMOSPHERE_LAYER_SPECS.map((spec) => {
    const url = arenaTextureUrlByBasename.get(spec.basename.toLowerCase())

    if (!url) return Promise.resolve(null as null | { spec: ArenaAtmosphereLayerSpec; tex: THREE.Texture })

    return loadTex(url)
      .then((tex) => ({ spec, tex }))
      .catch(() => null)
  })

  void Promise.all(loads).then((results) => {
    const group = new THREE.Group()
    group.name = 'arenaAtmosphereLayers'
    group.renderOrder = -2

    for (const item of results) {
      if (!item) continue

      const { spec, tex } = item

      tex.colorSpace = THREE.SRGBColorSpace
      tex.wrapS = THREE.RepeatWrapping
      tex.wrapT = THREE.RepeatWrapping

      if (spec.uvScroll) {
        uvScrollList.push({
          texture: tex,
          vx: spec.uvScroll.x,
          vy: spec.uvScroll.y,
        })
      }

      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: spec.opacity,
        depthWrite: false,
        depthTest: true,
        blending: spec.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      })

      if (spec.plane === 'vertical') {
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(planeW, planeH), mat)
        const zStack = zBackdrop - Math.min(spec.zBias, 0.35) * 0.8
        mesh.position.set(center.x, center.y + size.y * 0.02, zStack)
        group.add(mesh)
      } else {
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(planeW, floorDepth), mat)
        mesh.rotation.x = -Math.PI / 2
        mesh.position.set(center.x, bounds.min.y - 0.06, center.z)
        group.add(mesh)
      }
    }

    if (group.children.length > 0) {
      const host = stageRoot.parent ?? scene
      host.add(group)
      stageRoot.attach(group)
      stageRoot.userData.atmosphereUvScrollTextures = uvScrollList
      const parent = stageRoot.parent
      if (parent) parent.userData.atmosphereUvScrollTextures = uvScrollList
    }
  })
}

/**
 * Luz pontual ancorada ao AABB do palco (lareira ≈ centro-esquerda em vista lateral; balcão ≈ direita).
 * Evita posições fixas em mundo que não batem com `prepareArenaForGameView`.
 */
function addArenaAccentLights(scene: THREE.Scene, stageRoot: THREE.Object3D) {
  stageRoot.updateWorldMatrix(true, true)

  const bounds = getGeometryBounds(stageRoot)

  if (bounds.isEmpty()) return

  const center = bounds.getCenter(new THREE.Vector3())
  const size = bounds.getSize(new THREE.Vector3())
  const extent = Math.max(size.x, size.y, size.z, 0.01)

  const hearthPool = new THREE.PointLight(0xffa060, 1.05, extent * 1.1, 2)
  hearthPool.name = 'arenaHearthPulse'
  hearthPool.position.set(
    center.x - size.x * 0.14,
    center.y + size.y * 0.18,
    center.z + size.z * 0.06,
  )
  scene.add(hearthPool)
  scene.userData.arenaHearthPulse = hearthPool
  stageRoot.userData.arenaHearthPulse = hearthPool

  const barWarmth = new THREE.PointLight(0xffb878, 0.62, extent * 0.95, 2)
  barWarmth.position.set(
    center.x + size.x * 0.26,
    center.y + size.y * 0.16,
    center.z + size.z * 0.05,
  )
  scene.add(barWarmth)
  stageRoot.attach(hearthPool)
  stageRoot.attach(barWarmth)
}

function textureHasRenderableImage(texture: THREE.Texture): boolean {
  const srcData = texture.source?.data

  if (srcData != null && typeof srcData === 'object') {
    if (typeof ImageBitmap !== 'undefined' && srcData instanceof ImageBitmap) {
      return srcData.width > 0 && srcData.height > 0
    }

    const maybeImg = srcData as Partial<HTMLImageElement & HTMLVideoElement & ImageBitmap>

    if (typeof maybeImg.naturalWidth === 'number') {
      return maybeImg.naturalWidth > 0
    }

    if (typeof maybeImg.videoWidth === 'number') {
      return maybeImg.videoWidth > 0
    }
  }

  const img = texture.image

  if (img == null) return false
  if (typeof img !== 'object') return false

  if (typeof ImageBitmap !== 'undefined' && img instanceof ImageBitmap) {
    return img.width > 0 && img.height > 0
  }

  const element = img as Partial<HTMLImageElement & HTMLVideoElement>

  if (typeof element.naturalWidth === 'number') {
    return element.naturalWidth > 0 && (element.naturalHeight ?? 0) > 0
  }

  if (typeof element.videoWidth === 'number') {
    return element.videoWidth > 0
  }

  return false
}

function stripInvalidArenaTextures(root: THREE.Object3D) {
  root.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return

    const mesh = child as THREE.Mesh
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]

    for (const material of materials) {
      if (!material) continue

      const record = material as unknown as Record<string, unknown>

      for (const key of Object.keys(record)) {
        const value = record[key]

        if (value instanceof THREE.Texture && !textureHasRenderableImage(value)) {
          record[key] = null
          material.needsUpdate = true
        }
      }
    }
  })
}

function prepareArenaForGameView(arena: THREE.Object3D) {
  replaceSkinnedMeshes(arena)
  keepOnlyStageMeshes(arena)

  arena.rotation.set(0, arenaFrontRotationY, 0)
  arena.scale.setScalar(arenaScale)
  arena.updateWorldMatrix(true, true)

  const bounds = getGeometryBounds(arena)

  if (bounds.isEmpty()) {
    console.warn('Nenhum mesh visivel encontrado na arena.glb; usando cenario fallback.')
    return false
  }

  const center = bounds.getCenter(new THREE.Vector3())

  arena.position.set(
    -center.x,
    -bounds.min.y - 0.8,
    -center.z - 1.35,
  )

  arena.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return

    const mesh = child as THREE.Mesh
    mesh.receiveShadow = true
    mesh.castShadow = false
    mesh.frustumCulled = false
  })

  return true
}

function replaceSkinnedMeshes(root: THREE.Object3D) {
  const replacements: Array<{
    original: THREE.SkinnedMesh
    replacement: THREE.Mesh
  }> = []

  root.traverse((child) => {
    const mesh = child as THREE.SkinnedMesh

    if (!mesh.isSkinnedMesh) return

    const replacement = new THREE.Mesh(mesh.geometry, mesh.material)
    replacement.name = mesh.name
    replacement.position.copy(mesh.position)
    replacement.quaternion.copy(mesh.quaternion)
    replacement.scale.copy(mesh.scale)
    replacement.matrix.copy(mesh.matrix)
    replacement.matrixWorld.copy(mesh.matrixWorld)
    replacement.matrixAutoUpdate = mesh.matrixAutoUpdate
    replacement.visible = mesh.visible
    replacement.frustumCulled = false
    replacement.castShadow = false
    replacement.receiveShadow = true

    replacements.push({ original: mesh, replacement })
  })

  for (const { original, replacement } of replacements) {
    original.parent?.add(replacement)
    original.parent?.remove(original)
  }
}

function keepOnlyStageMeshes(root: THREE.Object3D) {
  let visibleMeshes = 0

  root.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return

    const mesh = child as THREE.Mesh
    mesh.visible = isStageMesh(mesh)

    if (mesh.visible) {
      visibleMeshes += 1
    }
  })

  if (visibleMeshes > 0) return

  root.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return

    const mesh = child as THREE.Mesh
    mesh.visible = isStageMesh(mesh)
  })
}

/**
 * Geometria só para cubemap no Source 2 (`OBJECT_TYPE_RENDER_TO_CUBEMAPS` / material primary_black).
 * Incluir no palco distorce AABB, pode cobrir a taverna ou puxar o centrado para longe do aggregate real.
 */
function isCubemapOccluderMesh(mesh: THREE.Mesh): boolean {
  const names = getObjectNamePath(mesh)

  return names.some((name) => (
    /** Mesmo resource que no Node Data: cubemap capture, não geometria da taverna. */
    name.includes('node000_lr0_c2_s_cb_mesh_mat0_primary_black')
    || name.includes('_cb_mesh_mat0_primary_black')
  ))
}

/**
 * Recursos do pacote Sleet Fighter / Crownfall (maps + models): minifight_tavern, tusktown01 aggregate,
 * tuss_tav_*, tuskhouse01, tuskfolk001b_f, penguin_alt, crystal_maiden, etc. — exceto cubemap e câmera de debut.
 */
function isStageMesh(mesh: THREE.Mesh) {
  const names = getObjectNamePath(mesh)

  if (names.some((name) => name.includes('minifight_debut_camera'))) {
    return false
  }

  if (names.some((name) => (
    name.includes('penguin_alt')
    || name.includes('whiskey_the_stout')
    || name.includes('tuskfolk001b_f')
    || name.includes('crystal_maiden')
  ))) {
    return false
  }

  return names.some((name) => (
    name.includes('minifight')
    || name.includes('primary_black')
    || name.includes('tusktown01')
    || name.includes('node000_prop')
    || name.includes('tuss_tav')
    || name.includes('tuskhouse01')
    || name.includes('tuskhouse')
  ))
}

/** `minifight_debut_camera.vmdl` é rig de câmera no Source — sem geometria útil no viewer WebGL. */
function isReferenceMesh(mesh: THREE.Mesh) {
  const names = getObjectNamePath(mesh)

  return names.some((name) => name.includes('minifight_debut_camera'))
}

/**
 * O export do Source 2 inclui assets fonte no root do GLB (personagens/props sem transform de mapa)
 * além das instâncias pequenas realmente posicionadas na arena. Esses nós identidade explodem o AABB
 * e fazem o enquadramento parecer que o `arena.glb` sumiu ou ficou fora do cenário.
 */
function isLooseSourceReferenceMesh(mesh: THREE.Mesh) {
  const names = getObjectNamePath(mesh)

  if (!names.some((name) => (
    name.includes('penguin_alt')
    || name.includes('tuskfolk001b_f')
    || name.includes('crystal_maiden')
  ))) {
    return false
  }

  return isIdentityTransform(mesh)
}

function isIdentityTransform(object: THREE.Object3D) {
  const epsilon = 1e-5

  return (
    object.position.lengthSq() < epsilon
    && Math.abs(object.quaternion.x) < epsilon
    && Math.abs(object.quaternion.y) < epsilon
    && Math.abs(object.quaternion.z) < epsilon
    && Math.abs(object.quaternion.w - 1) < epsilon
    && Math.abs(object.scale.x - 1) < epsilon
    && Math.abs(object.scale.y - 1) < epsilon
    && Math.abs(object.scale.z - 1) < epsilon
  )
}

void isCubemapOccluderMesh
void isReferenceMesh
void isLooseSourceReferenceMesh

function getObjectNamePath(object: THREE.Object3D) {
  const names: string[] = []

  let current: THREE.Object3D | null = object

  while (current) {
    if (current.name) {
      names.push(current.name)
    }

    current = current.parent
  }

  return names
}

function getGeometryBounds(root: THREE.Object3D) {
  root.updateWorldMatrix(true, true)

  const bounds = new THREE.Box3()
  const vertex = new THREE.Vector3()

  root.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh || !child.visible) return

    const mesh = child as THREE.Mesh
    const position = mesh.geometry.getAttribute('position')

    if (!position) return

    for (let index = 0; index < position.count; index += 1) {
      vertex.fromBufferAttribute(position, index)
      bounds.expandByPoint(vertex.applyMatrix4(mesh.matrixWorld))
    }
  })

  return bounds
}

function countVisibleMeshes(root: THREE.Object3D) {
  let count = 0

  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh && child.visible) {
      count += 1
    }
  })

  return count
}

function createSimple2DStage(scene: THREE.Scene) {
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 7),
    new THREE.MeshBasicMaterial({ color: 0x1d1215 }),
  )
  wall.position.set(0, 2.65, -2)
  scene.add(wall)

  const backGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(7, 4.2),
    new THREE.MeshBasicMaterial({
      color: 0x60311e,
      transparent: true,
      opacity: 0.28,
    }),
  )
  backGlow.position.set(-1.7, 2.65, -1.95)
  scene.add(backGlow)

  const coldGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(5.6, 4.8),
    new THREE.MeshBasicMaterial({
      color: 0x1f4f8f,
      transparent: true,
      opacity: 0.26,
    }),
  )
  coldGlow.position.set(4.6, 2.8, -1.94)
  scene.add(coldGlow)

  const beamMaterial = new THREE.MeshBasicMaterial({ color: 0x5b3427 })
  const lanternMaterial = new THREE.MeshBasicMaterial({ color: 0xffb04d })

  for (const x of [-5.6, -2.8, 0, 2.8, 5.6]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 4.9, 0.05), beamMaterial)
    pillar.position.set(x, 2.55, -1.85)
    scene.add(pillar)

    const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.7, 0.05), lanternMaterial)
    lantern.position.set(x + 0.45, 3.55, -1.8)
    scene.add(lantern)
  }

  const backCounter = new THREE.Mesh(
    new THREE.BoxGeometry(15.6, 0.55, 0.08),
    new THREE.MeshBasicMaterial({ color: 0x2a2020 }),
  )
  backCounter.position.set(0, 1.05, -1.75)
  scene.add(backCounter)

  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(15.5, 0.55, 1.5),
    new THREE.MeshStandardMaterial({
      color: 0x3f3430,
      roughness: 0.9,
    }),
  )
  floor.position.set(0, -0.28, 0)
  scene.add(floor)

  const fightLine = new THREE.Mesh(
    new THREE.BoxGeometry(12.8, 0.08, 0.08),
    new THREE.MeshBasicMaterial({ color: 0xc8a85c }),
  )
  fightLine.position.set(0, 0.04, -0.25)
  scene.add(fightLine)

  const centerMark = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.1, 1.2),
    new THREE.MeshBasicMaterial({ color: 0xe0c179 }),
  )
  centerMark.position.set(0, 0.08, -0.05)
  scene.add(centerMark)

  const leftBoundary = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.9, 0.22),
    new THREE.MeshBasicMaterial({ color: 0x6e3c2a }),
  )
  leftBoundary.position.set(-6.5, 0.55, -0.2)
  scene.add(leftBoundary)

  const rightBoundary = leftBoundary.clone()
  rightBoundary.position.x = 6.5
  scene.add(rightBoundary)
}
