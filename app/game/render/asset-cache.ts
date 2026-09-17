import * as T from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'

T.Cache.enabled = true

type Managed = T.LoadingManager & { __sfImages?: boolean }

const pending = new Map<string, Promise<GLTF>>()
const ready = new Map<string, GLTF>()
const imageManager = new T.LoadingManager() as Managed
attachReliableImages(imageManager)

function attachReliableImages(manager: T.LoadingManager) {
    const managed = manager as Managed
    if (managed.__sfImages) return
    managed.addHandler(/\.(avif|bmp|gif|jpe?g|png|webp)(\?.*)?$/i, createRetryTextureLoader(manager))
    managed.__sfImages = true
}

function createRetryTextureLoader(manager: T.LoadingManager) {
    const loader = new T.TextureLoader(manager)
    loader.load = (url: string, onLoad?, onProgress?, onError?) => {
        const texture = new T.Texture() as T.Texture<HTMLImageElement>
        const images = new T.ImageLoader(manager)
        images.setCrossOrigin(loader.crossOrigin)
        images.setPath(loader.path)
        images.setRequestHeader(loader.requestHeader)
        images.setWithCredentials(loader.withCredentials)
        const maxAttempts = 4
        const start = (attempt: number) => {
            images.load(url, image => {
                texture.image = image
                texture.needsUpdate = true
                onLoad?.(texture)
            }, onProgress, error => {
                if (attempt < maxAttempts) {
                    globalThis.setTimeout(() => start(attempt + 1), 180 * attempt)
                    return
                }
                onError?.(error)
            })
        }
        start(1)
        return texture
    }
    return loader
}

export function healHeroMaterials(root: T.Object3D) {
    root.traverse(object => {
        const mesh = object as T.Mesh
        if (!mesh.isMesh) return
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        for (const material of materials) {
            if (!(material instanceof T.MeshStandardMaterial)) continue
            try {
                // Specmask is already KHR specular. Painting it as colored emissive
                // turns the whole hero into a neon lamp (pink Arcana, orange Marci).
                material.emissive.setRGB(0, 0, 0)
                material.emissiveIntensity = 0
                // glTF default metalness is 1. If the ORM map never arrived, skin/cloth turns black.
                if (!material.metalnessMap) {
                    material.metalness = Math.min(material.metalness, 0.12)
                }
                if (!material.roughnessMap) {
                    material.roughness = Math.max(material.roughness, 0.55)
                }
                material.envMapIntensity = 0.72
                material.needsUpdate = true
            } catch {
                if (!material.metalnessMap) material.metalness = Math.min(material.metalness, 0.12)
                if (!material.roughnessMap) material.roughness = Math.max(material.roughness, 0.55)
                material.needsUpdate = true
            }
        }
    })
}

export function loadGltf(url: string, manager?: T.LoadingManager, onProgress?: (ratio: number) => void) {
    const cached = ready.get(url)
    if (cached) {
        healHeroMaterials(cached.scene)
        return Promise.resolve(cached)
    }
    const existing = pending.get(url)
    if (existing) return existing
    const mgr = manager ?? imageManager
    attachReliableImages(mgr)
    const job = new Promise<GLTF>((resolve, reject) => {
        new GLTFLoader(mgr).load(url, resolve, event => {
            if (event.lengthComputable && event.total > 0) onProgress?.(event.loaded / event.total)
        }, reject)
    }).then(gltf => {
        healHeroMaterials(gltf.scene)
        ready.set(url, gltf)
        pending.delete(url)
        return gltf
    }, error => {
        pending.delete(url)
        throw error
    })
    pending.set(url, job)
    return job
}
