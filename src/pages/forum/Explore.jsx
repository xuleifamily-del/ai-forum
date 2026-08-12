import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, MessageCircle, ThumbsUp, Clock } from 'lucide-react'
import { exploreQuestions } from './mockData.js'

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

  const sorted = [...exploreQuestions].sort((a, b) => {
    if (sort === 'hot') return b.hot - a.hot
    return 0
  })

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
        {sorted.map((q) => (
          <QuestionCard key={q.id} q={q} />
        ))}
      </div>
    </>
  )
}
