import { crowdAssetUrls } from './arena-crowd'
import { loadGltf } from './asset-cache'
import { FIGHTER_PRESENCE, ensureStock, fighterJobs, stockFighters } from './fighters'

export type BootProgress = { ratio: number; label: string }

const extras = [
    ...crowdAssetUrls().map(url => ({ url, label: 'Crowd' })),
    { url: '/effects/tusk/whiskey_the_stout_slider.glb', label: 'Effects' },
    { url: '/arena/arena-scene.glb', label: 'Arena' },
]

export async function prepareMatchEntry(heroes: string[], onProgress: (progress: BootProgress) => void) {
    const { prepareArena } = await import('./arena-game')
    const need = new Map<string, number>()
    for (const id of heroes) need.set(id, (need.get(id) ?? 0) + 1)
    const jobs = [...need.entries()]
    onProgress({ ratio: .08, label: 'Building fighters' })
    for (let i = 0; i < jobs.length; i++) {
        const [id, copies] = jobs[i]
        await ensureStock(id, FIGHTER_PRESENCE, copies)
        onProgress({ ratio: .12 + ((i + 1) / Math.max(1, jobs.length)) * .62, label: 'Building fighters' })
    }
    onProgress({ ratio: .82, label: 'Building arena' })
    try { await prepareArena() } catch (error) { console.warn('Arena not prepared for fight', error) }
    onProgress({ ratio: 1, label: 'Ready' })
}

export async function preloadMatch(onProgress: (progress: BootProgress) => void) {
    const jobs = [...new Map([...fighterJobs, ...extras].map(job => [job.url, job])).values()]
    const { arenaTextureManager, prepareArena } = await import('./arena-game')
    const manager = arenaTextureManager()
    let done = 0
    let cursor = 0
    const report = (label: string, fraction = 0) => onProgress({ ratio: Math.min(1, (done + fraction) / jobs.length) * .9, label })
    async function worker() {
        while (cursor < jobs.length) {
            const job = jobs[cursor++]
            report(job.label)
            try {
                await loadGltf(job.url, job.url.startsWith('/arena/arena-scene') ? manager : undefined, fraction => report(job.label, Math.min(.99, fraction)))
            } catch (error) {
                console.warn('Failed to preload', job.url, error)
            }
            done++
            report(job.label, 1)
        }
    }
    await Promise.all(Array.from({ length: 3 }, worker))
    onProgress({ ratio: .92, label: 'Building fighters' })
    await stockFighters(1, 1)
    await stockFighters(FIGHTER_PRESENCE, 2)
    onProgress({ ratio: .97, label: 'Building arena' })
    try { await prepareArena() } catch (error) { console.warn('Arena not prepared on boot', error) }
    onProgress({ ratio: 1, label: 'Ready' })
}
