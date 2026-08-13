import { Link, useLocation, useNavigate } from 'react-router-dom'
import { MessagesSquare, Search, Plus, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useForumApp } from '../../contexts/ForumAppContext.jsx'

export default function Navbar({ active = 'home', identityAvatarStyle, avatarText, identityNickname }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const { user, logout } = useForumApp()

  const navItems = [
    { key: 'home', label: '首页', path: '/' },
    { key: 'explore', label: '问题广场', path: '/explore' },
    { key: 'dashboard', label: '数据看板', path: '/dashboard' },
  ]

  const isActive = (key) => {
    if (active) return active === key
    if (key === 'home') return location.pathname === '/'
    return location.pathname.startsWith(`/${key}`)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-aif-border bg-aif-card/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-aif-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-aif-primary text-aif-primary-foreground">
            <MessagesSquare className="h-5 w-5" />
          </span>
          <span>AI 论坛</span>
        </Link>

        {/* 导航 */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.key}
              to={item.path}
              className={`nav-item rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive(item.key)
                  ? 'bg-aif-primary-50 text-aif-primary'
                  : 'text-aif-muted-foreground hover:bg-aif-muted hover:text-aif-foreground'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* 搜索+提问+身份 */}
        <div className="flex items-center gap-3">
          {/* 搜索框 */}
          <form
            onSubmit={handleSearch}
            className="relative hidden sm:block"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索问题…"
              className="h-9 w-64 rounded-md border border-aif-input bg-aif-muted px-3 pr-9 text-sm text-aif-foreground placeholder:text-aif-muted-foreground focus:border-aif-primary focus:outline-none focus:ring-2 focus:ring-aif-primary/20"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 text-aif-muted-foreground hover:text-aif-foreground"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>

          {/* 提问按钮 */}
          <Link
            to="/ask"
            className="inline-flex items-center gap-1.5 rounded-md bg-aif-primary px-3 py-2 text-sm font-semibold text-aif-primary-foreground hover:bg-aif-primary-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">提问</span>
          </Link>

          {/* 登录/注册/用户 */}
          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-sm font-medium text-aif-foreground sm:inline">{user.username}</span>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-1.5 rounded-md border border-aif-border bg-aif-card px-3 py-2 text-sm font-medium text-aif-foreground hover:bg-aif-muted transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">退出</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 rounded-md border border-aif-border bg-aif-card px-3 py-2 text-sm font-semibold text-aif-foreground hover:bg-aif-muted transition-colors"
              >
                登录
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 rounded-md bg-aif-primary px-3 py-2 text-sm font-semibold text-aif-primary-foreground hover:bg-aif-primary-600 transition-colors"
              >
                注册
              </Link>
            </div>
          )}

          {/* 匿名身份 */}
          <button
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
            style={identityAvatarStyle}
            title={identityNickname || '匿名身份'}
          >
            {avatarText || '匿'}
          </button>
        </div>
      </div>
    </header>
  )
}
