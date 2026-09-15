import type { State } from '../shared/combat'
import { Connection } from './client'

export type LobbyMode = 'local' | 'online'

export type LobbyPerson = {
  id: string
  nick: string
  hero: string
  ready: boolean
  online: boolean
}

export type LobbyRoom = {
  code: string
  host: string | null
  people: LobbyPerson[]
  queue: string[]
  pair: string[]
  deadline: number
  bracket: Array<{ round: number; players: string[]; done: boolean; winner?: string }>
  champion: string | null
  active: boolean
  paused?: boolean
  pauseUntil?: number
  missing?: string[]
}

export type LobbyRoomSummary = {
  code: string
  host: string
  players: number
  queue: number
  active: boolean
}

export type LobbySnapshot = {
  connection: Connection | null
  room: LobbyRoom | null
  ownId: string
  mode: LobbyMode
  status: string
  connecting: boolean
  match: State | null
  result: string
  openRooms: LobbyRoomSummary[]
  paused: boolean
  pauseUntil: number
  pauseMessage: string
}

type ResumeSession = {
  code: string
  id: string
  token: string
  nick: string
}

type Listener = (snapshot: LobbySnapshot, event?: string) => void

const RESUME_KEY = 'sleet-room-session'

function storedHero() {
  try {
    return JSON.parse(sessionStorage.getItem('sleet-pick') || '').p1 || 'tusk'
  } catch {
    return 'tusk'
  }
}

function readResume(): ResumeSession | null {
  try {
    const raw = sessionStorage.getItem(RESUME_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as ResumeSession
    if (!data?.code || !data?.id || !data?.token) return null
    return data
  } catch {
    return null
  }
}

function writeResume(session: ResumeSession | null) {
  try {
    if (!session) sessionStorage.removeItem(RESUME_KEY)
    else sessionStorage.setItem(RESUME_KEY, JSON.stringify(session))
  } catch {
    /* ignore */
  }
}

export class LobbySession {
  connection: Connection | null = null
  room: LobbyRoom | null = null
  ownId = ''
  mode: LobbyMode = 'local'
  status = ''
  connecting = false
  match: State | null = null
  result = ''
  openRooms: LobbyRoomSummary[] = []
  paused = false
  pauseUntil = 0
  pauseMessage = ''
  private listeners = new Set<Listener>()
  private generation = 0
  private endpoint = ''
  private apiUrl = ''
  private connectTimer = 0
  private browseTimer = 0
  private pauseTicker = 0
  private lastNick = 'Viewer'

  configure(endpoint: string, apiUrl = '') {
    this.endpoint = endpoint
    this.apiUrl = apiUrl || endpoint.replace(/^ws/, 'http').replace(/:\d+$/, ':3010')
  }

  snapshot(): LobbySnapshot {
    return {
      connection: this.connection,
      room: this.room,
      ownId: this.ownId,
      mode: this.mode,
      status: this.status,
      connecting: this.connecting,
      match: this.match,
      result: this.result,
      openRooms: this.openRooms,
      paused: this.paused,
      pauseUntil: this.pauseUntil,
      pauseMessage: this.pauseMessage,
    }
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener)
    listener(this.snapshot())
    return () => this.listeners.delete(listener)
  }

  private emit(event?: string) {
    const snapshot = this.snapshot()
    for (const listener of this.listeners) listener(snapshot, event)
  }

  setMode(mode: LobbyMode) {
    this.mode = mode
    this.emit('mode')
  }

  async refreshRooms() {
    if (!this.apiUrl || this.room) return
    try {
      const response = await fetch(`${this.apiUrl.replace(/\/$/, '')}/rooms`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json() as { rooms?: LobbyRoomSummary[] }
      this.openRooms = Array.isArray(data.rooms) ? data.rooms : []
      this.emit('rooms')
    } catch {
      this.openRooms = []
      this.emit('rooms')
    }
  }

  startBrowsing() {
    void this.refreshRooms()
    window.clearInterval(this.browseTimer)
    this.browseTimer = window.setInterval(() => void this.refreshRooms(), 4000)
  }

  stopBrowsing() {
    window.clearInterval(this.browseTimer)
    this.browseTimer = 0
  }

  private clearPauseTicker() {
    window.clearInterval(this.pauseTicker)
    this.pauseTicker = 0
  }

  private setPaused(until: number, missing: string[] = []) {
    this.paused = until > Date.now()
    this.pauseUntil = until
    const names = missing
      .map(id => this.room?.people.find(person => person.id === id)?.nick ?? 'Fighter')
      .join(', ')
    const tick = () => {
      const left = Math.max(0, Math.ceil((this.pauseUntil - Date.now()) / 1000))
      this.pauseMessage = left
        ? `Waiting for reconnect${names ? ` from ${names}` : ''}… ${left}s`
        : 'Reconnect time expired'
      this.status = this.pauseMessage
      this.emit('paused')
      if (left <= 0) this.clearPauseTicker()
    }
    this.clearPauseTicker()
    tick()
    if (this.paused) this.pauseTicker = window.setInterval(tick, 250)
  }

  private clearPaused() {
    this.paused = false
    this.pauseUntil = 0
    this.pauseMessage = ''
    this.clearPauseTicker()
  }

  tryResume() {
    const session = readResume()
    if (!session || this.room || this.connecting) return false
    this.connect('join', session.nick || 'Viewer', session.code, session)
    return true
  }

  connect(
    type: 'create' | 'join',
    nick: string,
    code = '',
    resume: ResumeSession | null = null,
  ) {
    this.disconnect(false)
    this.stopBrowsing()
    const generation = ++this.generation
    if (!this.endpoint) {
      this.status = 'Multiplayer server not configured.'
      this.emit('error')
      return
    }
    this.lastNick = nick.trim().slice(0, 24) || 'Viewer'
    const connection = new Connection(this.endpoint)
    this.connection = connection
    this.ownId = ''
    this.mode = 'online'
    this.connecting = true
    this.clearPaused()
    this.status = resume
      ? 'Reconnecting to room…'
      : type === 'create'
        ? 'Creating room…'
        : 'Joining room…'
    this.result = ''
    this.emit('connecting')

    window.clearTimeout(this.connectTimer)
    this.connectTimer = window.setTimeout(() => {
      if (generation !== this.generation || !this.connecting) return
      this.connecting = false
      this.status = 'Connection timed out. Check that sleet-fighter-server is running.'
      connection.close()
      this.connection = null
      this.emit('error')
      this.startBrowsing()
    }, 8000)

    connection.onmessage = message => {
      if (generation !== this.generation || connection !== this.connection) return
      if (message.type === 'connected') {
        connection.send({
          type,
          nick: this.lastNick,
          code: code.trim().toUpperCase(),
          resumeId: resume?.id,
          resumeToken: resume?.token,
        })
      }
      if (message.type === 'welcome') {
        window.clearTimeout(this.connectTimer)
        this.ownId = message.id
        this.connecting = false
        this.status = message.resumed
          ? `Reconnected to room ${message.code}`
          : `Connected to room ${message.code}`
        writeResume({
          code: message.code,
          id: message.id,
          token: message.token,
          nick: this.lastNick,
        })
        connection.send({ type: 'hero', hero: storedHero() })
      }
      if (message.type === 'room') {
        window.clearTimeout(this.connectTimer)
        this.room = message as LobbyRoom
        this.connecting = false
        this.stopBrowsing()
        if (message.paused && message.pauseUntil) {
          this.setPaused(message.pauseUntil, message.missing ?? [])
        } else if (!message.paused) {
          this.clearPaused()
        }
      }
      if (message.type === 'start') {
        this.match = message.state
        this.status = this.paused ? this.pauseMessage : 'Fight started'
        if (message.resumed) this.clearPaused()
      }
      if (message.type === 'paused') {
        this.setPaused(message.until, message.missing ?? [])
      }
      if (message.type === 'resumed') {
        this.clearPaused()
        this.match = message.state
        this.status = 'Fight resumed'
        this.connection?.adoptMatch({
          pair: message.pair,
          state: message.state,
          acks: message.acks,
        })
      }
      if (message.type === 'result') {
        const winner = this.room?.people.find(person => person.id === message.winner)?.nick ?? message.winner
        this.result = `Winner: ${winner} · ${message.reason}`
        this.status = this.result
        this.match = null
        this.clearPaused()
        if (connection) connection.state = null
        writeResume(null)
      }
      if (message.type === 'error') {
        window.clearTimeout(this.connectTimer)
        this.connecting = false
        this.status = message.message
        if (!this.room) {
          connection.close()
          this.connection = null
          this.ownId = ''
          writeResume(null)
          this.startBrowsing()
        }
      }
      if (message.type === 'disconnected') {
        window.clearTimeout(this.connectTimer)
        this.connecting = false
        this.status = message.message
        this.connection = null
        // Keep resume token so F5 / reload can reclaim the seat within the grace window.
        this.room = null
        this.ownId = ''
        this.match = null
        this.clearPaused()
        this.startBrowsing()
      }
      this.emit(message.type)
    }
  }

  send(type: string) {
    this.connection?.send({ type })
  }

  selectHero(hero: string) {
    this.connection?.send({ type: 'hero', hero })
  }

  clearMatch() {
    this.match = null
    if (this.connection) this.connection.state = null
  }

  /** Intentional leave: notify server to remove this seat, then close. */
  exit() {
    const connection = this.connection
    if (connection?.connected) {
      try {
        connection.send({ type: 'exit' })
      } catch {
        /* ignore */
      }
    }
    writeResume(null)
    this.disconnect(true)
  }

  disconnect(notify = true) {
    this.generation++
    window.clearTimeout(this.connectTimer)
    this.clearPauseTicker()
    const connection = this.connection
    this.connection = null
    this.room = null
    this.ownId = ''
    this.match = null
    this.connecting = false
    this.status = ''
    this.result = ''
    this.clearPaused()
    if (connection) {
      connection.onmessage = () => {}
      connection.close()
    }
    if (notify) {
      this.emit('disconnect')
      this.startBrowsing()
    }
  }
}

export const lobbySession = new LobbySession()
