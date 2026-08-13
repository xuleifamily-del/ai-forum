import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn, User, Lock, AlertCircle } from 'lucide-react'
import { useForumApp } from '../../contexts/ForumAppContext.jsx'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useForumApp()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password) return
    setError('')
    setLoading(true)
    try {
      await login(username.trim(), password)
      navigate('/')
    } catch (err) {
      setError(err.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center py-8">
      <div className="w-full max-w-md rounded-xl border border-aif-border bg-aif-card p-8 shadow-aif-card">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-aif-primary text-aif-primary-foreground">
            <LogIn className="h-6 w-6" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-aif-foreground">登录</h1>
          <p className="mt-1 text-sm text-aif-muted-foreground">登录后即可参与提问与互动</p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-aif-error/30 bg-aif-error-bg p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-aif-error" />
            <p className="flex-1 text-sm text-aif-error">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="login-username" className="block text-sm font-semibold text-aif-foreground">
              用户名
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-aif-muted-foreground" />
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                autoComplete="username"
                className="w-full rounded-lg border border-aif-input bg-aif-card py-3 pl-9 pr-4 text-base text-aif-foreground placeholder:text-aif-muted-foreground focus:border-aif-primary focus:outline-none focus:ring-2 focus:ring-aif-primary/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="login-password" className="block text-sm font-semibold text-aif-foreground">
              密码
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-aif-muted-foreground" />
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                autoComplete="current-password"
                className="w-full rounded-lg border border-aif-input bg-aif-card py-3 pl-9 pr-4 text-base text-aif-foreground placeholder:text-aif-muted-foreground focus:border-aif-primary focus:outline-none focus:ring-2 focus:ring-aif-primary/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!username.trim() || !password || loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-aif-primary px-5 py-3 text-sm font-semibold text-aif-primary-foreground hover:bg-aif-primary-600 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogIn className="h-4 w-4" />
            {loading ? '登录中…' : '登录'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-aif-muted-foreground">
          没有账号？{' '}
          <Link to="/register" className="font-semibold text-aif-primary hover:text-aif-primary-700 transition-colors">
            去注册
          </Link>
        </p>
      </div>
    </div>
  )
}
