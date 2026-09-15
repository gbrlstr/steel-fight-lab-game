export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const lobby = useLobbyStore()
  lobby.init(String(config.public.wsUrl ?? ''), String(config.public.apiUrl ?? ''))
})
