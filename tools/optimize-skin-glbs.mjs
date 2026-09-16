import fs from 'node:fs'
import path from 'node:path'
import { optimize } from './optimize-glb.mjs'

const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])
const marker = `${path.sep}skins${path.sep}`
let ok = 0
let skip = 0
for (const file of walk('public/fighters').filter(f => f.includes(marker) && f.endsWith('.glb'))) {
    try {
        optimize(file)
        ok++
    } catch (error) {
        skip++
        console.warn('skip', file, error instanceof Error ? error.message : error)
    }
}
console.log(`Skin GLBs optimized: ${ok}. skipped: ${skip}.`)
