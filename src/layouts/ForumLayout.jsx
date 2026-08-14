import { Outlet, useLocation } from 'react-router-dom'
import Navbar from '../components/forum/Navbar.jsx'
import Footer from '../components/forum/Footer.jsx'
import NotificationToast from '../components/forum/NotificationToast.jsx'
import { useForumApp } from '../contexts/ForumAppContext.jsx'

export default function ForumLayout() {
  const location = useLocation()
  const active = (() => {
    if (location.pathname === '/') return 'home'
    if (location.pathname.startsWith('/explore')) return 'explore'
    if (location.pathname.startsWith('/dashboard')) return 'dashboard'
    return null
  })()

  const { identity } = useForumApp()

  const avatarStyle = (() => {
    if (!identity?.avatarSeed) return {}
    const [c1, c2, angle] = identity.avatarSeed.split('|')
    return { background: `linear-gradient(${angle}deg, ${c1}, ${c2})` }
  })()

  const avatarText = identity?.nickname?.slice(-1) ?? '匿'

  return (
    <div className="forum-root min-h-screen flex flex-col bg-aif-background text-aif-foreground font-aif-sans">
      <Navbar active={active} identityAvatarStyle={avatarStyle} avatarText={avatarText} identityNickname={identity?.nickname} />
      <NotificationToast />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
