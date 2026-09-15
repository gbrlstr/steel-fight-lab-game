import type { State } from '../game/shared/combat'
import type { LobbyRoomSummary } from '../game/net/lobby-session'

export type ClientMessage =
  | { type: 'create'; nick: string }
  | { type: 'join'; nick: string; code: string; resumeId?: string; resumeToken?: string }
  | { type: 'list' }
  | { type: 'hero'; hero: string }
  | { type: 'queue' | 'ready' | 'call' | 'tournament' | 'leave' | 'exit' }
  | { type: 'ping'; at: number }
  | { type: 'input'; seq: number; frame: number; input: Record<string, boolean> }

export type ServerMessage =
  | { type: 'connected' }
  | { type: 'welcome'; id: string; code: string; token: string; resumed?: boolean }
  | { type: 'rooms'; rooms: LobbyRoomSummary[] }
  | {
      type: 'room'
      code: string
      host: string | null
      people: unknown[]
      queue: string[]
      pair: string[]
      paused?: boolean
      pauseUntil?: number
      missing?: string[]
    }
  | { type: 'start'; pair: string[]; state: State; acks?: number[]; resumed?: boolean }
  | { type: 'paused'; until: number; missing: string[]; seconds: number }
  | { type: 'resumed'; pair: string[]; state: State; acks?: number[] }
  | { type: 'snapshot'; state: State; hash: number; acks: number[] }
  | { type: 'result'; winner: string; reason: string }
  | { type: 'pong'; at: number }
  | { type: 'error'; message: string }
