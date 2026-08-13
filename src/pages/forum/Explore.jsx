import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Eye, MessageCircle, ThumbsUp, Clock } from 'lucide-react'
import { fetchQuestions } from '../../services/questionRepository.js'

function timeAgo(ts) {
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} 小时前`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day} 天前`
  const mo = Math.floor(day / 30)
  return `${mo} 个月前`
}

function TagBadge({ text, color }) {
  const colors = {
    primary: 'bg-aif-primary-50 text-aif-primary-700',
    success: 'bg-aif-success-bg text-aif-success',
    muted: 'bg-aif-muted text-aif-muted-foreground',
  }
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${colors[color] || colors.muted}`}>
      {text}
    </span>
  )
}

function QuestionCard({ q }) {
  return (
    <Link
      to={`/detail/${q.id}`}
      className="group block rounded-xl border border-aif-border bg-aif-card p-5 shadow-sm transition-all hover:border-aif-primary-300 hover:shadow-md"
    >
      <h2 className="text-lg font-semibold text-aif-foreground group-hover:text-aif-primary transition-colors">
        {q.title}
      </h2>
      <p className="mt-2 line-clamp-2 text-sm text-aif-muted-foreground">{q.excerpt}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {q.tags.map((t, i) => (
          <TagBadge key={i} text={t.text} color={t.color} />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-aif-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" /> {q.views.toLocaleString()} 浏览
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageCircle className="h-3.5 w-3.5" /> {q.answers} 回答
        </span>
        <span className="inline-flex items-center gap-1 text-aif-success">
          <ThumbsUp className="h-3.5 w-3.5" /> {q.likes} 赞同
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" /> {q.createdAt}
        </span>
      </div>
    </Link>
  )
}

export default function Explore() {
  const [sort, setSort] = useState('latest')
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadQuestions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchQuestions({ sort, limit: 20 })
      setQuestions(res.items)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [sort])

  useEffect(() => {
    loadQuestions()
  }, [loadQuestions])

  const mapQuestionForCard = (q) => {
    const stripped = (q.body || '')
      .replace(/\*\*/g, '')
      .replace(/`/g, '')
      .replace(/^#+\s*/gm, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_~>]/g, '')
      .replace(/\n+/g, ' ')
      .trim()
    const excerpt = stripped.length > 140 ? stripped.slice(0, 140) + '…' : stripped
    return {
      id: q.id,
      title: q.title,
      excerpt,
      tags: (q.tags || []).slice(0, 3).map((t) => ({ text: t, color: 'primary' })),
      views: q.viewCount,
      answers: q.answerCount,
      likes: q.viewCount,
      createdAt: timeAgo(q.createdAt),
      hot: q.viewCount,
    }
  }

  return (
    <>
      <section className="w-full border-b border-aif-border bg-aif-card -mx-4 -mt-6 px-4 pb-8 pt-8 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 mb-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-aif-foreground sm:text-3xl">
              问题广场
            </h1>
            <p className="mt-1 text-sm text-aif-muted-foreground">
              浏览社区里的全部问题，发现有趣的讨论
            </p>
          </div>
          <div className="inline-flex items-center rounded-lg border border-aif-border bg-aif-muted p-1">
            <button
              type="button"
              onClick={() => setSort('latest')}
              className={`sort-tab inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                sort === 'latest'
                  ? 'bg-aif-card text-aif-primary shadow-sm'
                  : 'text-aif-muted-foreground hover:text-aif-foreground'
              }`}
            >
              最新
            </button>
            <button
              type="button"
              onClick={() => setSort('hot')}
              className={`sort-tab inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                sort === 'hot'
                  ? 'bg-aif-card text-aif-primary shadow-sm'
                  : 'text-aif-muted-foreground hover:text-aif-foreground'
              }`}
            >
              热度
            </button>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-4">
        {loading && (
          <div className="text-center py-12 text-aif-muted-foreground">加载中…</div>
        )}
        {error && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm text-aif-error">加载失败：{error.message || '未知错误'}</p>
            <button
              type="button"
              onClick={loadQuestions}
              className="inline-flex items-center rounded-md bg-aif-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-aif-primary-600"
            >
              重试
            </button>
          </div>
        )}
        {!loading && !error && questions.map((q) => (
          <QuestionCard key={q.id} q={mapQuestionForCard(q)} />
        ))}
      </div>
    </>
  )
}
