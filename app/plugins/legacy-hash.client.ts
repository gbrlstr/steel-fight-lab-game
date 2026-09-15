export default defineNuxtPlugin((nuxtApp) => {
  const routes: Record<string, string> = {
    menu: '/',
    lobby: '/lobby',
    select: '/select',
    fight: '/fight',
    game: '/dev/game',
    debug: '/dev/debug',
  }

  function redirect() {
    const hash = location.hash.slice(1).toLowerCase()
    const route = routes[hash]
    if (!route) return
    history.replaceState(history.state, '', location.pathname + location.search)
    void nuxtApp.$router.replace(route)
  }

  redirect()
  window.addEventListener('hashchange', redirect)
  if (import.meta.hot) import.meta.hot.dispose(() => window.removeEventListener('hashchange', redirect))
})
