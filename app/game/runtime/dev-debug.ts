import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { fitModelToGround, loadTuskarModel } from '../lab/tuskar'

export function mountDebugPage(app: HTMLElement) {
  app.innerHTML = `
    <nav class="topbar">
      <a class="brand" href="#debug">Steel Fight Lab</a>
      <div class="tabs">
        <a class="active" href="#debug">Debug</a>
        <a href="#game">Game</a>
      </div>
    </nav>
    <main class="viewport-page">
      <div class="viewport" data-view></div>
      <aside class="panel">
        <h1>Model Debug</h1>
        <p>Use this screen to test Tusk, animations, and movement before bringing them into the game.</p>
        <dl>
          <div><dt>W/S</dt><dd>walk forward/back</dd></div>
          <div><dt>A/D</dt><dd>rotate character</dd></div>
          <div><dt>1</dt><dd>idle</dd></div>
          <div><dt>2</dt><dd>run</dd></div>
          <div><dt>3</dt><dd>attack</dd></div>
          <div><dt>4</dt><dd>walrus_punch</dd></div>
          <div><dt>5</dt><dd>stun</dd></div>
          <div><dt>Space</dt><dd>return to idle</dd></div>
        </dl>
      </aside>
    </main>
  `

  const view = app.querySelector<HTMLDivElement>('[data-view]')

  if (!view) {
    throw new Error('Debug viewport container not found')
  }

  const viewport = view

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x111111)

  const camera = new THREE.PerspectiveCamera(60, getAspect(viewport), 0.1, 1000)
  camera.position.set(0, 2, 5)

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(viewport.clientWidth, viewport.clientHeight)
  viewport.appendChild(renderer.domElement)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 1, 0)

  scene.add(new THREE.AmbientLight(0xffffff, 1.5))

  const directionalLight = new THREE.DirectionalLight(0xffffff, 3)
  directionalLight.position.set(5, 10, 5)
  scene.add(directionalLight)
  scene.add(new THREE.GridHelper(10, 10))

  const timer = new THREE.Timer()
  timer.connect(document)
  const playerForward = new THREE.Vector3()
  const actions: Record<string, THREE.AnimationAction> = {}
  const keys = {
    forward: false,
    backward: false,
    left: false,
    right: false,
  }

  let mixer: THREE.AnimationMixer | null = null
  let player: THREE.Object3D | null = null
  let currentAction: THREE.AnimationAction | null = null
  let currentActionName: string | null = null
  let isTestingAnimation = false
  let animationFrameId = 0
  let disposed = false

  loadTuskarModel()
    .then(({ model, animations }) => {
      if (disposed) return

      player = model
      scene.add(model)

      const info = fitModelToGround(model)
      camera.position.set(0, info.height, info.size.length() * 2)
      controls.target.set(0, info.height / 2, 0)
      controls.update()

      if (animations.length > 0) {
        mixer = new THREE.AnimationMixer(model)

        for (const clip of animations) {
          actions[clip.name] = mixer.clipAction(clip)
        }

        if (actions.run) {
          actions.run.timeScale = 0.75
        }

        playAnimation('idle')
        console.log('Animações disponíveis:', animations.map((clip) => clip.name))
      }
    })
    .catch((error: unknown) => {
      console.error('Erro ao carregar Tusk no debug:', error)
    })

  function animate(timestamp?: number) {
    animationFrameId = requestAnimationFrame(animate)

    timer.update(timestamp)
    const delta = timer.getDelta()

    if (mixer) {
      mixer.update(delta)
    }

    updatePlayerMovement(delta)
    controls.update()
    renderer.render(scene, camera)
  }

  function playAnimation(name: string, fadeDuration = 0.2) {
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

    const isMoving = keys.forward || keys.backward

    if (keys.left) {
      player.rotation.y += 3 * delta
    }

    if (keys.right) {
      player.rotation.y -= 3 * delta
    }

    if (isMoving) {
      isTestingAnimation = false
      playAnimation('run')

      const direction = keys.forward ? 1 : -1

      playerForward.set(0, 0, direction)
      playerForward.applyQuaternion(player.quaternion)
      player.position.addScaledVector(playerForward, 1.8 * delta)
    } else if (!isTestingAnimation) {
      playAnimation('idle')
    }

    controls.target.lerp(player.position, 0.1)
  }

  function testAnimation(name: string) {
    isTestingAnimation = true
    playAnimation(name)
    console.log('Testando animação:', name)
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.code === 'KeyW') keys.forward = true
    if (event.code === 'KeyS') keys.backward = true
    if (event.code === 'KeyA') keys.left = true
    if (event.code === 'KeyD') keys.right = true

    if (event.code === 'Digit1') testAnimation('idle')
    if (event.code === 'Digit2') testAnimation('run')
    if (event.code === 'Digit3') testAnimation('attack')
    if (event.code === 'Digit4') testAnimation('walrus_punch')
    if (event.code === 'Digit5') testAnimation('stun')

    if (event.code === 'Space') {
      isTestingAnimation = false
      playAnimation('idle')
    }
  }

  function handleKeyUp(event: KeyboardEvent) {
    if (event.code === 'KeyW') keys.forward = false
    if (event.code === 'KeyS') keys.backward = false
    if (event.code === 'KeyA') keys.left = false
    if (event.code === 'KeyD') keys.right = false
  }

  function handleResize() {
    camera.aspect = getAspect(viewport)
    camera.updateProjectionMatrix()
    renderer.setSize(viewport.clientWidth, viewport.clientHeight)
  }

  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  window.addEventListener('resize', handleResize)

  animate()

  return () => {
    disposed = true
    cancelAnimationFrame(animationFrameId)
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
    window.removeEventListener('resize', handleResize)
    controls.dispose()
    timer.dispose()
    renderer.dispose()
  }
}

function getAspect(element: HTMLElement) {
  return element.clientWidth / Math.max(element.clientHeight, 1)
}
