import * as T from 'three'
import { hurtBox, roster, shotBox, strikeBox, volume, WORLD_PER_SIM, type State } from '../shared/combat'

const DEPTH = .62
const PLANE_Z = 4.15

function ribbon(color: number) {
    const line = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(1, 1, 1)), new T.LineBasicMaterial({ color, transparent: true, opacity: .95, depthTest: false }))
    line.frustumCulled = false
    line.renderOrder = 12
    line.visible = false
    return line
}

function place(line: T.LineSegments, box: number[]) {
    const x0 = box[0] * WORLD_PER_SIM, x1 = box[1] * WORLD_PER_SIM
    const y0 = -box[3] * WORLD_PER_SIM, y1 = -box[2] * WORLD_PER_SIM
    line.position.set((x0 + x1) / 2, (y0 + y1) / 2, PLANE_Z)
    line.scale.set(Math.max(.04, x1 - x0), Math.max(.04, y1 - y0), DEPTH)
    line.visible = true
}

export function hitboxDebug() {
    const root = new T.Group()
    const hurt = [ribbon(0x3dff9a), ribbon(0x3dff9a)]
    const hit = [ribbon(0xff4d3a), ribbon(0xff4d3a)]
    const shots = Array.from({ length: 6 }, () => ribbon(0x6ecbff))
    root.add(...hurt, ...hit, ...shots)
    return {
        root,
        update(state: State, shown: boolean) {
            root.visible = shown
            if (!shown) return
            state.fighters.forEach((f, i) => {
                place(hurt[i], volume(f, hurtBox(f)))
                const strike = strikeBox(f)
                if (strike) place(hit[i], volume(f, strike))
                else hit[i].visible = false
            })
            shots.forEach(line => { line.visible = false })
            state.projectiles.forEach((p, i) => {
                const def = roster[state.fighters[p.owner].hero].m_vecActionDefinitions.find((a: { m_nActionID: string }) => a.m_nActionID === p.action)
                if (!def?.m_HitBox || !shots[i]) return
                place(shots[i], volume(p, shotBox(state.fighters[p.owner].hero, p.action, def.m_HitBox)))
            })
        },
        dispose() {
            root.traverse(o => {
                const line = o as T.LineSegments
                if (!line.isLineSegments) return
                line.geometry.dispose()
                ;(line.material as T.Material).dispose()
            })
        }
    }
}
