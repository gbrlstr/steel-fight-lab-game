import { defineStore } from 'pinia'
import { markRaw, ref, shallowRef } from 'vue'
import {
  lobbySession,
  type LobbyMode,
  type LobbyRoom,
  type LobbyRoomSummary,
} from '../game/net/lobby-session'
import type { State } from '../game/shared/combat'

export const useLobbyStore = defineStore('lobby', () => {
  const client = markRaw(lobbySession)
  const room = shallowRef<LobbyRoom | null>(null)
  const ownId = ref('')
  const mode = ref<LobbyMode>('local')
  const status = ref('')
  const connecting = ref(false)
  const match = shallowRef<State | null>(null)
  const result = ref('')
  const lastEvent = ref('')
  const openRooms = shallowRef<LobbyRoomSummary[]>([])
  const paused = ref(false)
  const pauseUntil = ref(0)
  const pauseMessage = ref('')
  let initialized = false

  function init(endpoint: string, apiUrl = '') {
    client.configure(endpoint, apiUrl)
    if (initialized) return
    initialized = true
    client.subscribe((snapshot, event) => {
      room.value = snapshot.room
      ownId.value = snapshot.ownId
      mode.value = snapshot.mode
      status.value = snapshot.status
      connecting.value = snapshot.connecting
      match.value = snapshot.match
      result.value = snapshot.result
      openRooms.value = snapshot.openRooms
      paused.value = snapshot.paused
      pauseUntil.value = snapshot.pauseUntil
      pauseMessage.value = snapshot.pauseMessage
      lastEvent.value = event ?? ''
    })
    client.startBrowsing()
    client.tryResume()
  }

  function setMode(value: LobbyMode) {
    client.setMode(value)
  }

  function connect(type: 'create' | 'join', nick: string, code = '') {
    client.connect(type, nick, code)
  }

  return {
    room,
    ownId,
    mode,
    status,
    connecting,
    match,
    result,
    lastEvent,
    openRooms,
    paused,
    pauseUntil,
    pauseMessage,
    init,
    setMode,
    connect,
    refreshRooms: () => client.refreshRooms(),
    tryResume: () => client.tryResume(),
    send: (type: string) => client.send(type),
    selectHero: (hero: string) => client.selectHero(hero),
    disconnect: () => client.disconnect(),
    exit: () => client.exit(),
    clearMatch: () => client.clearMatch(),
    connection: () => client.connection,
  }
})
