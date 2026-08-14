import { Link, useLocation, useNavigate } from 'react-router-dom'
import { MessagesSquare, Search, Plus, LogOut, Menu, X, Home, Compass, BarChart3 } from 'lucide-react'
import { useState } from 'react'
import { useForumApp } from '../../contexts/ForumAppContext.jsx'

export default function Navbar({ active = 'home', identityAvatarStyle, avatarText, identityNickname }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout } = useForumApp()

  const navItems = [
    { key: 'home', label: '首页', path: '/', icon: Home },
    { key: 'explore', label: '问题广场', path: '/explore', icon: Compass },
    { key: 'dashboard', label: '数据看板', path: '/dashboard', icon: BarChart3 },
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
    <header className="sticky top-0 z-50 w-full border-b border-aif-border bg-aif-card/80 backdrop-blur relative">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-aif-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-aif-primary text-aif-primary-foreground">
            <MessagesSquare className="h-5 w-5" />
          </span>
          <span>AI 论坛</span>
        </Link>

        {/* 桌面端导航 */}
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
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 text-aif-muted-foreground hover:text-aif-foreground min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>

          {/* 提问按钮 */}
          <Link
            to={user ? "/ask" : "/login"}
            className="inline-flex items-center gap-1.5 rounded-md bg-aif-primary px-3 py-2 text-sm font-semibold text-aif-primary-foreground hover:bg-aif-primary-600 transition-colors min-w-[44px] min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">提问</span>
          </Link>

          {/* 登录/注册/用户 - 桌面端 */}
          <div className="hidden sm:flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden text-sm font-medium text-aif-foreground sm:inline">{user.username}</span>
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center gap-1.5 rounded-md border border-aif-border bg-aif-card px-3 py-2 text-sm font-medium text-aif-foreground hover:bg-aif-muted transition-colors min-w-[44px] min-h-[44px]"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">退出</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 rounded-md border border-aif-border bg-aif-card px-3 py-2 text-sm font-semibold text-aif-foreground hover:bg-aif-muted transition-colors min-w-[44px] min-h-[44px]"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 rounded-md bg-aif-primary px-3 py-2 text-sm font-semibold text-aif-primary-foreground hover:bg-aif-primary-600 transition-colors min-w-[44px] min-h-[44px]"
                >
                  注册
                </Link>
              </>
            )}

            {/* 头像：已登录显示用户名首字，未登录显示匿名身份 */}
            {user ? (
              <button
                className="relative flex h-9 w-9 items-center justify-center rounded-full bg-aif-primary text-xs font-bold text-aif-primary-foreground min-w-[44px] min-h-[44px]"
                title={user.username}
              >
                {user.username.charAt(0).toUpperCase()}
              </button>
            ) : (
              <button
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white min-w-[44px] min-h-[44px]"
                style={identityAvatarStyle}
                title={identityNickname || '匿名身份'}
              >
                {avatarText || '匿'}
              </button>
            )}
          </div>

          {/* 移动端汉堡按钮 */}
          <div className="sm:hidden flex items-center gap-2">
            <button
              onClick={() => setMenuOpen(x => !x)}
              className="p-2 rounded-lg hover:bg-aif-muted transition min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="菜单"
            >
              {menuOpen ? <X className="h-5 w-5 text-aif-foreground" /> : <Menu className="h-5 w-5 text-aif-foreground" />}
            </button>
          </div>
        </div>
      </div>

      {/* 移动端菜单面板 */}
      {menuOpen && (
        <div className="sm:hidden absolute top-full left-0 right-0 bg-aif-card border-b border-aif-border shadow-md py-2 px-4 z-40 animate-slideDown">
          <div className="mb-3 pb-3 border-b border-aif-border">
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <button
                    className="relative flex h-10 w-10 items-center justify-center rounded-full bg-aif-primary text-xs font-bold text-aif-primary-foreground"
                    title={user.username}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </button>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-aif-foreground">{user.username}</p>
                    <button
                      type="button"
                      onClick={() => { logout(); setMenuOpen(false) }}
                      className="mt-1 inline-flex items-center gap-1.5 text-xs text-aif-muted-foreground hover:text-aif-error"
                    >
                      <LogOut className="h-3 w-3" />
                      退出登录
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    className="relative flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={identityAvatarStyle}
                    title={identityNickname || '匿名身份'}
                  >
                    {avatarText || '匿'}
                  </button>
                  <div className="flex-1 flex gap-2">
                    <Link
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      className="flex-1 text-center rounded-md border border-aif-border bg-aif-card px-3 py-2 text-xs font-semibold text-aif-foreground hover:bg-aif-muted"
                    >
                      登录
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMenuOpen(false)}
                      className="flex-1 text-center rounded-md bg-aif-primary px-3 py-2 text-xs font-semibold text-aif-primary-foreground hover:bg-aif-primary-600"
                    >
                      注册
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 移动端搜索 */}
          <form
            onSubmit={(e) => { handleSearch(e); setMenuOpen(false) }}
            className="relative mb-3"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索问题…"
              className="w-full h-11 rounded-md border border-aif-input bg-aif-muted px-3 pr-11 text-sm text-aif-foreground placeholder:text-aif-muted-foreground focus:border-aif-primary focus:outline-none focus:ring-2 focus:ring-aif-primary/20"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-2 text-aif-muted-foreground hover:text-aif-foreground min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>

          {/* 导航链接 */}
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.key}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 rounded-lg py-3 px-2 text-base font-medium transition-colors ${
                  isActive(item.key)
                    ? 'bg-aif-primary-50 text-aif-primary'
                    : 'text-aif-foreground hover:bg-aif-muted'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </div>
      )}
    </header>
  )
}
