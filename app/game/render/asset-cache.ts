import * as T from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'

T.Cache.enabled = true

const pending = new Map<string, Promise<GLTF>>()
const ready = new Map<string, GLTF>()

export function loadGltf(url: string, manager?: T.LoadingManager, onProgress?: (ratio: number) => void) {
    const cached = ready.get(url)
    if (cached) return Promise.resolve(cached)
    const existing = pending.get(url)
    if (existing) return existing
    const job = new Promise<GLTF>((resolve, reject) => {
        new GLTFLoader(manager).load(url, resolve, event => {
            if (event.lengthComputable && event.total > 0) onProgress?.(event.loaded / event.total)
        }, reject)
    }).then(gltf => {
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
