import { crowdAssetUrls } from './arena-crowd'
import { loadGltf } from './asset-cache'
import { FIGHTER_PRESENCE, ensureStock, fighterJobs, stockFighters } from './fighters'

export type BootProgress = { ratio: number; label: string }

const extras = [
    ...crowdAssetUrls().map(url => ({ url, label: 'Crowd' })),
    { url: '/effects/tusk/whiskey_the_stout_slider.glb', label: 'Effects' },
    { url: '/arena/arena-scene.glb', label: 'Arena' },
]

export async function prepareMatchEntry(picks: Array<string | { id: string; skin?: string }>, onProgress: (progress: BootProgress) => void) {
    const { prepareArena } = await import('./arena-game')
    const need = new Map<string, { id: string; skin: string; copies: number }>()
    for (const pick of picks) {
        const id = typeof pick === 'string' ? pick : pick.id
        const skin = typeof pick === 'string' ? 'default' : (pick.skin ?? 'default')
        const key = `${id}::${skin}`
        const current = need.get(key)
        if (current) current.copies += 1
        else need.set(key, { id, skin, copies: 1 })
    }
    const jobs = [...need.values()]
    onProgress({ ratio: .08, label: 'Building fighters' })
    for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i]
        await ensureStock(job.id, FIGHTER_PRESENCE, job.copies, job.skin)
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
