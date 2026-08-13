import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { runForumBootstrap } from '../bootstrap/forumBootstrap.js'
import IdentityService from '../services/identityService.js'

export const ForumAppContext = createContext(null)

export function ForumAppProvider({ children }) {
  const [identity, setIdentity] = useState(null)
  const [behaviorProfile, setBehaviorProfile] = useState(null)
  const [aiAvailable] = useState(true)
  const [dbAvailable, setDbAvailable] = useState(false)
  const [redisAvailable, setRedisAvailable] = useState(false)
  const [bootstrapping, setBootstrapping] = useState(true)

  const bootstrap = useCallback(async () => {
    setBootstrapping(true)
    const res = await runForumBootstrap()
    setIdentity(res.identity)
    setBehaviorProfile(res.behaviorProfile)
    setDbAvailable(res.dbAvailable)
    setRedisAvailable(res.redisAvailable)
    setBootstrapping(false)
  }, [])

  const refreshIdentity = useCallback(async () => {
    IdentityService.reset()
    return bootstrap()
  }, [bootstrap])

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  if (bootstrapping) {
    return (
      <div className="forum-root min-h-screen flex flex-col bg-aif-background text-aif-foreground font-aif-sans">
        <div className="flex-1 flex items-center justify-center text-aif-muted-foreground">正在初始化…</div>
      </div>
    )
  }

  return (
    <ForumAppContext.Provider value={{ identity, behaviorProfile, aiAvailable, dbAvailable, redisAvailable, refreshIdentity }}>
      {children}
    </ForumAppContext.Provider>
  )
}

export function useForumApp() {
  const ctx = useContext(ForumAppContext)
  if (!ctx) throw new Error('useForumApp must be used within ForumAppProvider')
  return ctx
}
