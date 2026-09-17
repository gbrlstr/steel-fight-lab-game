import * as T from 'three'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'

const rooms = new WeakMap<T.WebGLRenderer, T.Texture>()

function bakeStudio(renderer: T.WebGLRenderer) {
    const scene = new T.Scene()
    scene.background = new T.Color(0x6e7c92)
    scene.add(new T.HemisphereLight(0xf3f6ff, 0x3a2a22, 1.6))
    const key = new T.DirectionalLight(0xffe4c8, 2.4)
    key.position.set(5, 9, 6)
    scene.add(key)
    const rim = new T.DirectionalLight(0x90b4ff, 1.1)
    rim.position.set(-7, 4, -5)
    scene.add(rim)
    const previous = renderer.getRenderTarget()
    const pmrem = new T.PMREMGenerator(renderer)
    const env = pmrem.fromScene(scene, 0.04).texture
    pmrem.dispose()
    renderer.setRenderTarget(previous)
    return env
}

export function heroEnvironment(renderer: T.WebGLRenderer) {
    const cached = rooms.get(renderer)
    if (cached) return cached
    try {
        const env = bakeStudio(renderer)
        rooms.set(renderer, env)
        return env
    } catch (error) {
        console.warn('Hero environment indisponível', error)
        return null
    }
}

export function createSceneBloom(
    renderer: T.WebGLRenderer,
    options: { strength?: number; radius?: number; threshold?: number; alpha?: boolean } = {},
) {
    const size = new T.Vector2()
    renderer.getDrawingBufferSize(size)
    const frame = new T.WebGLRenderTarget(Math.max(1, size.x), Math.max(1, size.y), {
        minFilter: T.LinearFilter,
        magFilter: T.LinearFilter,
        depthBuffer: true,
    })
    const bloom = new UnrealBloomPass(size.clone(), options.strength ?? 0.36, options.radius ?? 0.52, options.threshold ?? 0.76)
    bloom.renderToScreen = false
    const copy = new T.MeshBasicMaterial({
        map: frame.texture,
        transparent: !!options.alpha,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
    })
    const quad = new FullScreenQuad(copy)
    return {
        begin() {
            renderer.getDrawingBufferSize(size)
            if (frame.width !== size.x || frame.height !== size.y) {
                frame.setSize(Math.max(1, size.x), Math.max(1, size.y))
                bloom.setSize(size.x, size.y)
            }
            renderer.setRenderTarget(frame)
        },
        end() {
            try {
                bloom.render(renderer, frame, frame, 0, false)
            } catch (error) {
                console.warn('Bloom skip', error)
            }
            renderer.setRenderTarget(null)
            if (options.alpha) {
                renderer.setClearColor(0x000000, 0)
                renderer.clear(true, false, false)
            }
            copy.map = frame.texture
            quad.render(renderer)
        },
        dispose() {
            frame.dispose()
            bloom.dispose()
            copy.dispose()
            quad.dispose()
        },
    }
}
