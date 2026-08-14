import { useState, useMemo, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Search, ArrowLeft, Sparkles, MessageCircle, ThumbsUp, Clock, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import * as behaviorService from '../../services/behaviorService.js'
import * as reverseRagService from '../../services/reverseRagService.js'
import * as aiInteractionService from '../../services/aiInteractionService.js'
import degradationService from '../../services/degradationService.js'
import { searchRewrite, searchSummary } from '../../services/aiService.js'
import useDebounce from '../../hooks/useDebounce.js'

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

function StatusBadge({ status }) {
  const map = {
    stable: { label: '已生成', cls: 'bg-aif-success-bg text-aif-success' },
    outdated: { label: '待更新', cls: 'bg-aif-warning-bg text-aif-warning' },
    regenerating: { label: '生成中', cls: 'bg-aif-primary-100 text-aif-primary animate-pulse' },
    updated: { label: '已更新', cls: 'bg-aif-info-bg text-aif-primary' },
    error: { label: '生成失败', cls: 'bg-red-100 text-red-600' },
  }
  const cfg = map[status] || map.stable
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

function SkeletonLines() {
  return (
    <div className="space-y-3">
      <div className="h-4 w-3/4 animate-pulse rounded bg-aif-muted" />
      <div className="h-4 w-full animate-pulse rounded bg-aif-muted" />
      <div className="h-4 w-5/6 animate-pulse rounded bg-aif-muted" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-aif-muted" />
    </div>
  )
}

function formatTimestamp(ts) {
  if (!ts) return ''
  const diff = Date.now() - ts
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return '刚刚'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} 分钟前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} 小时前`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day} 天前`
  const month = Math.floor(day / 30)
  if (month < 12) return `${month} 个月前`
  const year = Math.floor(month / 12)
  return `${year} 年前`
}

function pickTagColor(tag) {
  const t = (tag || '').toLowerCase()
  if (['react', 'vue', 'llm', 'ai', 'rag'].includes(t)) return 'primary'
  if (['入门', '指南', '教程', '最佳实践'].includes(tag)) return 'success'
  return 'muted'
}

function AiSummarySection({
  rewrittenHint,
  onSearchOriginal,
  aiSummaryText,
  summaryLoading,
  summaryError,
  relatedPosts,
  status,
}) {
  const showSection = aiSummaryText || summaryLoading || summaryError || rewrittenHint

  const citationPostMap = useMemo(() => {
    const map = {}
    if (Array.isArray(relatedPosts)) {
      relatedPosts.forEach((p, i) => {
        map[i + 1] = p?.id
      })
    }
    return map
  }, [relatedPosts])

  if (!showSection) return null

  const handleCitationClick = (e, n) => {
    e.preventDefault()
    const postId = citationPostMap[n]
    if (postId && typeof window !== 'undefined') {
      window.location.hash = ''
      window.location.href = `/detail/${postId}`
    }
  }

  return (
    <section
      aria-labelledby="ai-summary-title"
      className="mb-8 rounded-xl border border-aif-border bg-aif-card p-5 shadow-sm sm:p-6"
      style={{ borderLeft: '4px solid #5b6cff' }}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-aif-primary-100 text-aif-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          <h2 id="ai-summary-title" className="text-lg font-semibold text-aif-foreground">
            AI 要点摘要
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={summaryLoading ? 'regenerating' : summaryError ? 'error' : status} />
        </div>
      </div>

      {rewrittenHint && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-aif-primary/20 bg-aif-primary-50 px-3 py-2 text-sm">
          <span className="text-aif-foreground">
            已为你改写搜索词：<span className="font-medium text-aif-muted-foreground">{rewrittenHint.original}</span>
            {' → '}
            <span className="font-semibold text-aif-primary">{rewrittenHint.rewritten}</span>
          </span>
          <button
            type="button"
            onClick={onSearchOriginal}
            className="inline-flex items-center gap-1 rounded-md border border-aif-border bg-aif-card px-2 py-1 text-xs font-medium text-aif-foreground hover:bg-aif-muted transition-colors"
          >
            搜索原词
          </button>
        </div>
      )}

      <div className="text-sm leading-relaxed text-aif-card-foreground [&_a]:text-aif-primary [&_a]:underline [&_code]:bg-aif-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-[0.85em] [&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-gray-100 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0">
        {summaryLoading ? (
          <SkeletonLines />
        ) : summaryError ? (
          <p className="text-aif-muted-foreground">
            AI 摘要生成暂不可用，请查看下方相关帖子获取完整内容。
          </p>
        ) : aiSummaryText ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ node, children, ...props }) => {
                const href = props.href || ''
                const match = /^\[(\d+)\]$/.exec(String(children || ''))
                if (match) {
                  const n = parseInt(match[1], 10)
                  const postId = citationPostMap[n]
                  return (
                    <a
                      {...props}
                      href={postId ? `/detail/${postId}` : href}
                      onClick={(e) => handleCitationClick(e, n)}
                      className="inline-flex cursor-pointer font-medium no-underline hover:underline"
                    >
                      [{n}]
                    </a>
                  )
                }
                return (
                  <a {...props} target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                )
              },
              p: ({ children }) => {
                const raw = Array.isArray(children) ? children : [children]
                const out = []
                for (let i = 0; i < raw.length; i++) {
                  const part = raw[i]
                  if (typeof part === 'string') {
                    const replaced = part.split(/(\[\d+\])/g).map((seg, j) => {
                      const m = /^\[(\d+)\]$/.exec(seg)
                      if (m) {
                        const n = parseInt(m[1], 10)
                        const postId = citationPostMap[n]
                        return (
                          <a
                            key={`cit-${i}-${j}`}
                            href={postId ? `/detail/${postId}` : `#citation-${n}`}
                            onClick={(e) => handleCitationClick(e, n)}
                            className="inline-flex cursor-pointer font-medium text-aif-primary no-underline hover:underline"
                          >
                            [{n}]
                          </a>
                        )
                      }
                      return seg
                    })
                    out.push(...replaced)
                  } else {
                    out.push(part)
                  }
                }
                return <p className="my-2 leading-relaxed">{out}</p>
              },
            }}
          >
            {aiSummaryText}
          </ReactMarkdown>
        ) : null}
      </div>
    </section>
  )
}

function EmptyStateCard({ query, rewritten }) {
  const suggestions = useMemo(() => {
    const src = (rewritten || query || '').split(/[\s,，。、;；]+/).filter(Boolean)
    const unique = [...new Set(src)]
    return unique.slice(0, 2)
  }, [query, rewritten])

  return (
    <section
      aria-labelledby="empty-state-title"
      className="mb-8 rounded-xl border border-dashed border-aif-border bg-aif-card p-6 sm:p-8"
      style={{ borderLeft: '4px solid #a3a3a3' }}
    >
      <div className="flex flex-col items-start gap-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-aif-muted text-aif-muted-foreground">
            <Search className="h-4 w-4" />
          </span>
          <h2 id="empty-state-title" className="text-lg font-semibold text-aif-foreground">
            未找到相关内容
          </h2>
        </div>
        <p className="text-sm text-aif-muted-foreground">
          未找到与「<span className="font-medium text-aif-foreground">{query}</span>」相关的帖子，试试更通用的关键词？
        </p>
        {suggestions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-aif-muted-foreground">✨ 小提示：尝试</span>
            {suggestions.map((s, i) => (
              <span key={i} className="rounded-md bg-aif-primary-100 px-2 py-1 font-medium text-aif-primary">
                「{s}」
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default function SearchPage() {
  const navigate = useNavigate()
  const [sp] = useSearchParams()
  const queryFromUrl = sp.get('q') || ''
  const [query, setQuery] = useState(queryFromUrl)
  const debouncedQuery = useDebounce(query, 300)
  const lastFetchedQuery = useRef('')

  useEffect(() => {
    aiInteractionService.markSessionEligible('search')
  }, [])

  useEffect(() => {
    const trimmed = debouncedQuery.trim()
    if (!trimmed) return
    if (trimmed === lastFetchedQuery.current) return
    lastFetchedQuery.current = trimmed
    navigate(`/search?q=${encodeURIComponent(trimmed)}`, { replace: true })
    runSearch(trimmed)
  }, [debouncedQuery, navigate])

  const [aiSummaryText, setAiSummaryText] = useState('')
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState(false)
  const [summaryStatus, setSummaryStatus] = useState('stable')

  const [relatedPosts, setRelatedPosts] = useState([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [emptyState, setEmptyState] = useState(false)
  const [emptyRewritten, setEmptyRewritten] = useState('')

  const [rewrittenHint, setRewrittenHint] = useState(null)
  const [initialQueryFromUrlDone, setInitialQueryFromUrlDone] = useState(false)

  const runSearch = async (rawQuery, { forceOriginal = false } = {}) => {
    const trimmed = (rawQuery || '').trim()
    if (!trimmed) return

    setPostsLoading(true)
    setSummaryLoading(true)
    setSummaryError(false)
    setEmptyState(false)
    setRelatedPosts([])
    setAiSummaryText('')
    setRewrittenHint(null)

    const startedAt = Date.now()
    let mockSummary = false
    let finalRewritten = trimmed
    let finalKeywords = []

    try {
      behaviorService.recordSearch(trimmed)

      const rewriteRes = await searchRewrite({ query: trimmed })
      const rewritten = rewriteRes?.rewritten || trimmed
      const keywords = Array.isArray(rewriteRes?.keywords) ? rewriteRes.keywords : []
      finalRewritten = rewritten
      finalKeywords = keywords

      const useQuery = forceOriginal ? trimmed : rewritten

      if (!forceOriginal && rewritten !== trimmed) {
        setRewrittenHint({ original: trimmed, rewritten })
      }

      const topQs = reverseRagService.retrieveTopQuestions({
        query: useQuery,
        tags: keywords,
        n: 10,
      })

      const posts = topQs
        .filter((q) => q && q.score > 0)
        .map((q, i) => {
          const firstTag = Array.isArray(q.tags) && q.tags.length > 0 ? q.tags[0] : '综合'
          return {
            id: q.id,
            title: q.title,
            excerpt: q.excerpt,
            tag: firstTag,
            tagColor: pickTagColor(firstTag),
            answers: q.answerCount || 0,
            likes: q.viewCount || 0,
            createdAt: formatTimestamp(q.createdAt),
            _raw: q,
          }
        })

      setPostsLoading(false)

      if (posts.length === 0) {
        setEmptyState(true)
        setEmptyRewritten(finalRewritten)
        setSummaryLoading(false)
        setRelatedPosts([])
        return
      }

      setRelatedPosts(posts)

      const top5ForSummary = posts.slice(0, 5).map((p) => ({
        id: p.id,
        title: p.title,
        excerpt: p.excerpt,
        tags: p._raw?.tags || [],
      }))

      const summaryStart = Date.now()
      try {
        const sumRes = await searchSummary({
          query: trimmed,
          rewritten: useQuery,
          topQuestions: top5ForSummary,
        })
        setAiSummaryText(sumRes?.content || '')
        mockSummary = sumRes?.mock === true
        setSummaryStatus('stable')
      } catch (sumErr) {
        try {
          degradationService.reportFailure(sumErr?.message || 'search_summary_error')
        } catch (_) {
          // ignore
        }
        setSummaryError(true)
        setAiSummaryText('')
      }
      const summaryDuration = Date.now() - summaryStart

      try {
        aiInteractionService.record({
          type: 'search',
          success: !summaryError,
          mock: mockSummary,
          duration: summaryDuration,
        })
      } catch (_) {
        // ignore
      }
    } catch (err) {
      try {
        degradationService.reportFailure(err?.message || 'search_pipeline_error')
      } catch (_) {
        // ignore
      }
      setSummaryError(true)
      setPostsLoading(false)
      setEmptyState(true)
      setEmptyRewritten(finalRewritten)
    } finally {
      setSummaryLoading(false)
    }
  }

  if (queryFromUrl && !initialQueryFromUrlDone) {
    setInitialQueryFromUrlDone(true)
    lastFetchedQuery.current = queryFromUrl.trim()
    queueMicrotask(() => {
      runSearch(queryFromUrl)
    })
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed) {
      lastFetchedQuery.current = trimmed
      navigate(`/search?q=${encodeURIComponent(trimmed)}`, { replace: true })
      runSearch(trimmed)
    }
  }

  const handleSearchOriginal = () => {
    if (rewrittenHint?.original) {
      runSearch(rewrittenHint.original, { forceOriginal: true })
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
              disabled={postsLoading || summaryLoading}
              className="absolute right-2 top-1/2 inline-flex h-9 -translate-y-1/2 items-center gap-1.5 rounded-md bg-aif-primary px-4 text-sm font-semibold text-aif-primary-foreground hover:bg-aif-primary-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {postsLoading || summaryLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span>搜索</span>
            </button>
          </form>
        </div>
      </div>

      {emptyState ? (
        <EmptyStateCard query={query || queryFromUrl} rewritten={emptyRewritten} />
      ) : (
        <AiSummarySection
          rewrittenHint={rewrittenHint}
          onSearchOriginal={handleSearchOriginal}
          aiSummaryText={aiSummaryText}
          summaryLoading={summaryLoading}
          summaryError={summaryError}
          relatedPosts={relatedPosts}
          status={summaryStatus}
        />
      )}

      <section aria-labelledby="related-posts-title">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="related-posts-title" className="text-lg font-semibold text-aif-foreground">
            相关帖子
          </h2>
          <span className="text-sm text-aif-muted-foreground">
            {postsLoading ? '检索中…' : `共 ${relatedPosts.length} 条`}
          </span>
        </div>

        <div className="flex flex-col gap-4">
          {postsLoading && (
            <>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-xl border border-aif-border bg-aif-card p-5 shadow-sm sm:p-6"
                >
                  <div className="h-5 w-2/3 animate-pulse rounded bg-aif-muted mb-2" />
                  <div className="h-4 w-full animate-pulse rounded bg-aif-muted mb-1" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-aif-muted mb-3" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-aif-muted" />
                </div>
              ))}
            </>
          )}
          {!postsLoading && relatedPosts.map((p, i) => (
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
                  <ThumbsUp className="h-3 w-3" /> {p.likes} 浏览
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {p.createdAt}
                </span>
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
