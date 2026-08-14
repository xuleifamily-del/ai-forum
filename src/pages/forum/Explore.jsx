import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Eye, MessageCircle, ThumbsUp, Clock } from 'lucide-react'
import { fetchQuestions } from '../../services/questionRepository.js'

const PAGE_SIZE = 10
const VALID_SORTS = ['latest', 'hot']

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

function QuestionCardSkeleton() {
  return (
    <div className="rounded-xl border border-aif-border bg-aif-card p-5 shadow-sm">
      <div className="h-6 w-3/4 animate-pulse rounded bg-aif-muted" />
      <div className="mt-3 h-4 w-full animate-pulse rounded bg-aif-muted" />
      <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-aif-muted" />
      <div className="mt-4 flex gap-2">
        <div className="h-5 w-12 animate-pulse rounded bg-aif-muted" />
        <div className="h-5 w-12 animate-pulse rounded bg-aif-muted" />
      </div>
      <div className="mt-4 flex gap-4">
        <div className="h-3.5 w-16 animate-pulse rounded bg-aif-muted" />
        <div className="h-3.5 w-16 animate-pulse rounded bg-aif-muted" />
        <div className="h-3.5 w-16 animate-pulse rounded bg-aif-muted" />
      </div>
    </div>
  )
}

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams()

  // 从 URL 派生 sort / page（带默认值与校验）
  const sortParam = searchParams.get('sort')
  const sort = VALID_SORTS.includes(sortParam) ? sortParam : 'latest'

  const pageParam = searchParams.get('page')
  let page = Number.parseInt(pageParam, 10)
  if (!Number.isFinite(page) || page < 1) page = 1

  const [questions, setQuestions] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchQuestions({ sort, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE })
      .then((res) => {
        if (cancelled) return
        setQuestions(res.items || [])
        setTotal(res.total || 0)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err)
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [sort, page, retryToken])

  const handleSortChange = (newSort) => {
    setSearchParams({ sort: newSort, page: '1' })
  }

  const handlePageChange = (newPage) => {
    setSearchParams({ sort, page: String(newPage) })
  }

  const handleRetry = () => setRetryToken((t) => t + 1)

  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE))

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
              onClick={() => handleSortChange('latest')}
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
              onClick={() => handleSortChange('hot')}
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
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <QuestionCardSkeleton key={i} />
            ))}
          </>
        )}
        {error && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm text-aif-error">加载失败：{error.message || '未知错误'}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center rounded-md bg-aif-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-aif-primary-600"
            >
              重试
            </button>
          </div>
        )}
        {!loading && !error && questions.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm text-aif-muted-foreground">还没有问题，去提问吧</p>
            <Link
              to="/ask"
              className="inline-flex items-center rounded-md bg-aif-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-aif-primary-600"
            >
              去提问
            </Link>
          </div>
        )}
        {!loading && !error && questions.map((q) => (
          <QuestionCard key={q.id} q={mapQuestionForCard(q)} />
        ))}
      </div>

      {!loading && !error && total > 0 && (
        <div className="mt-6 flex items-center justify-center gap-4 text-sm text-aif-muted-foreground">
          <button
            type="button"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="inline-flex items-center rounded-md border border-aif-border bg-aif-card px-3 py-1.5 font-medium text-aif-foreground transition-colors hover:border-aif-primary-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-aif-border"
          >
            上一页
          </button>
          <span className="tabular-nums">
            {page} / {lastPage}
          </span>
          <button
            type="button"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= lastPage}
            className="inline-flex items-center rounded-md border border-aif-border bg-aif-card px-3 py-1.5 font-medium text-aif-foreground transition-colors hover:border-aif-primary-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-aif-border"
          >
            下一页
          </button>
        </div>
      )}
    </>
  )
}
