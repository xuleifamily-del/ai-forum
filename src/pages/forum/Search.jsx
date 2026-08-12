import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Search, ArrowLeft, Sparkles, MessageCircle, ThumbsUp } from 'lucide-react'
import { searchResults } from './mockData.js'

function TagBadge({ text, color }) {
  const colors = {
    primary: 'bg-aif-primary-100 text-aif-primary',
    muted: 'bg-aif-muted text-aif-muted-foreground',
    success: 'bg-aif-success-bg text-aif-success',
  }
  return (
    <span className={`rounded-full px-2 py-0.5 font-medium text-xs ${colors[color] || colors.muted}`}>
      {text}
    </span>
  )
}

export default function SearchPage() {
  const navigate = useNavigate()
  const [sp] = useSearchParams()
  const queryFromUrl = sp.get('q') || searchResults.query
  const [query, setQuery] = useState(queryFromUrl)

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <>
      <div className="border-b border-aif-border bg-aif-card -mx-4 -mt-6 px-4 py-8 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 mb-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-aif-foreground sm:text-3xl">
            搜索结果
          </h1>

          <form className="relative w-full max-w-2xl" onSubmit={handleSearch}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="搜索"
              placeholder="输入关键词搜索…"
              className="h-12 w-full rounded-lg border border-aif-input bg-aif-muted pl-4 pr-32 text-base text-aif-foreground placeholder:text-aif-muted-foreground focus:border-aif-primary focus:outline-none focus:ring-2 focus:ring-aif-primary/20"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 inline-flex h-9 -translate-y-1/2 items-center gap-1.5 rounded-md bg-aif-primary px-4 text-sm font-semibold text-aif-primary-foreground hover:bg-aif-primary-600 transition-colors"
            >
              <Search className="h-4 w-4" />
              <span>搜索</span>
            </button>
          </form>
        </div>
      </div>

      <section
        aria-labelledby="ai-summary-title"
        className="mb-8 rounded-xl border border-aif-border bg-aif-card p-5 shadow-sm sm:p-6"
        style={{ borderLeft: '4px solid #5b6cff' }}
      >
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-aif-primary-100 text-aif-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          <h2 id="ai-summary-title" className="text-lg font-semibold text-aif-foreground">
            AI 要点摘要
          </h2>
        </div>
        <ul className="flex list-disc flex-col gap-3 pl-5 text-aif-foreground marker:text-aif-muted-foreground">
          {searchResults.aiSummary.map((item, i) => (
            <li key={i} className="pl-1">
              <span>{item.text}</span>
              <Link
                to={`/detail/src-${item.source}`}
                className="ml-1 inline-flex items-center text-sm font-medium text-aif-primary hover:underline"
              >
                [{item.source}]
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="text-aif-muted-foreground">来源：</span>
          <Link to="/detail/ref-1" className="font-medium text-aif-primary hover:underline">
            React 官方文档
          </Link>
          <span className="text-aif-muted-foreground">·</span>
          <Link to="/detail/ref-2" className="font-medium text-aif-primary hover:underline">
            Stack Overflow
          </Link>
          <span className="text-aif-muted-foreground">·</span>
          <Link to="/detail/ref-3" className="font-medium text-aif-primary hover:underline">
            社区精华帖
          </Link>
        </div>
      </section>

      <section aria-labelledby="related-posts-title">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="related-posts-title" className="text-lg font-semibold text-aif-foreground">
            相关帖子
          </h2>
          <span className="text-sm text-aif-muted-foreground">
            共 {searchResults.relatedPosts.length} 条
          </span>
        </div>

        <div className="flex flex-col gap-4">
          {searchResults.relatedPosts.map((p, i) => (
            <Link
              key={p.id}
              to={`/detail/${p.id}`}
              className={`group block rounded-xl border border-aif-border bg-aif-card p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6 ${
                i === 0 ? '' : ''
              }`}
            >
              <h3 className="mb-2 text-base font-semibold text-aif-foreground group-hover:text-aif-primary transition-colors">
                {p.title}
              </h3>
              <p className="mb-3 line-clamp-2 text-sm text-aif-muted-foreground">{p.excerpt}</p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-aif-muted-foreground">
                <TagBadge text={p.tag} color={p.tagColor} />
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" /> {p.answers} 回复
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp className="h-3 w-3" /> {p.likes} 赞同
                </span>
                <span>{p.createdAt}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-aif-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>返回首页</span>
        </Link>
      </div>
    </>
  )
}
