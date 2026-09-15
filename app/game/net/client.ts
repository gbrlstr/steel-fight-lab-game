import { step, checksum, RULES, isGuardInput } from '../shared/combat'
import type { Input, State } from '../shared/combat'

export class Connection {
    socket: WebSocket
    id = ''
    slot = -1
    seq = 0
    state: State | null = null
    pending = new Map<number, Input>()
    spectator: { at: number; state: State }[] = []
    ping = 0
    divergences = 0
    connected = false
    onmessage: (m: any) => void = () => { }

    constructor(endpoint?: string) {
        const url = endpoint || `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/net`
        this.socket = new WebSocket(url)
        this.socket.onopen = () => { this.connected = true; this.onmessage({ type: 'connected' }) }
        this.socket.onerror = () => { this.onmessage({ type: 'error', message: 'Failed to connect to the multiplayer server.' }) }
        this.socket.onclose = () => {
            this.connected = false
            this.onmessage({ type: 'disconnected', message: 'Connection closed. Join the room again.' })
        }
        this.socket.onmessage = e => {
            const m = JSON.parse(e.data)
            if (m.type === 'welcome') this.id = m.id
            if (m.type === 'pong') this.ping = Date.now() - m.at
            if (m.type === 'start' || m.type === 'resumed') this.adoptMatch(m)
            if (m.type === 'snapshot') {
                if (checksum(m.state) !== m.hash) { this.divergences++; return }
                if (this.slot < 0) this.spectator.push({ at: performance.now() + 150, state: m.state })
                else {
                    const target = this.state?.frame ?? m.state.frame
                    this.state = m.state
                    for (const f of this.pending.keys()) if (f <= m.state.frame) this.pending.delete(f)
                    if (Array.isArray(m.acks) && this.slot >= 0) {
                        const ack = m.acks[this.slot]
                        if (Number.isInteger(ack) && ack >= this.seq) this.seq = ack + 1
                    }
                    if (target - m.state.frame <= RULES.rollback) {
                        for (let f = m.state.frame + 1; f <= target; f++) this.predict(this.pending.get(f) ?? {})
                    }
                }
            }
            this.onmessage(m)
        }
    }

    /** Sync local rollback state after start/resume so inputs are accepted again. */
    adoptMatch(m: { pair: string[]; state: State; acks?: number[] }) {
        this.slot = m.pair.indexOf(this.id)
        this.state = m.state
        this.pending.clear()
        this.spectator = []
        const ack = Array.isArray(m.acks) && this.slot >= 0 ? m.acks[this.slot] : -1
        this.seq = (Number.isInteger(ack) ? ack : -1) + 1
    }

    private predict(input: Input) {
        if (!this.state || this.slot < 0) return
        const inputs: [Input, Input] = [{}, {}]
        inputs[this.slot] = input
        const remote = 1 - this.slot
        const remoteFighter = this.state.fighters[remote]
        const remoteMask = remoteFighter.lastMask
        const remoteX = remoteFighter.x
        const remoteFace = remoteFighter.face
        this.state = step(this.state, inputs)
        // Keep remote locomotion intent between authoritative snapshots.
        this.state.fighters[remote].lastMask = remoteMask
        // Guard chord (A+S+D) sets FORWARD|BACK|DOWN — must not extrapolate as walk.
        if (isGuardInput(remoteMask)) this.state.fighters[remote].x = remoteX
        else if (remoteMask & 1) this.state.fighters[remote].x = remoteX + remoteFace * RULES.speed
        else if (remoteMask & 2) this.state.fighters[remote].x = remoteX - remoteFace * RULES.speed
        else this.state.fighters[remote].x = remoteX
    }

    send(m: any) { if (this.socket.readyState === 1) this.socket.send(JSON.stringify(m)) }

    tick(input: Input) {
        if (!this.state) return
        if (this.slot < 0) {
            while (this.spectator.length && this.spectator[0].at <= performance.now()) this.state = this.spectator.shift()!.state
            return
        }
        const frame = this.state.frame + 1
        this.pending.set(frame, input)
        this.send({ type: 'input', seq: this.seq++, frame, input })
        this.predict(input)
        if (this.pending.size > RULES.rollback) this.pending.delete(this.pending.keys().next().value!)
    }

    close() {
        this.socket.onclose = null
        this.socket.onerror = null
        this.socket.close()
    }
}
