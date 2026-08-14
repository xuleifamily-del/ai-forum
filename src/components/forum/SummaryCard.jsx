import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Sparkles, ThumbsUp, RefreshCw, XCircle } from 'lucide-react'
import AiGate from './AiGate.jsx'

function timeAgoShort(ts) {
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

function StatusBadge({ status }) {
  const map = {
    stable: { label: '已稳定', cls: 'aif-success-bg text-aif-success' },
    outdated: { label: '待更新', cls: 'aif-warning-bg text-aif-warning' },
    regenerating: { label: '更新中', cls: 'aif-primary-bg text-aif-primary animate-pulse' },
    updated: { label: '已更新', cls: 'aif-info-bg text-aif-primary' },
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

/**
 * 把摘要内容中的 [N] 引用标记替换为可点击跳转的 a 标签
 * @param {string} content - 原始 Markdown 内容
 * @param {Array<{index:number, answerId:string}>} citations - 引用映射
 * @param {Array<string>} sourceAnswerIds - 原始 answer 顺序
 */
function buildCitationClickMap(content, citations, sourceAnswerIds) {
  const indexToAnswerId = {}
  if (Array.isArray(citations)) {
    for (const c of citations) {
      if (c && typeof c.index === 'number' && c.answerId) {
        indexToAnswerId[c.index] = c.answerId
      }
    }
  }
  if (Array.isArray(sourceAnswerIds)) {
    sourceAnswerIds.forEach((aid, i) => {
      if (aid && !indexToAnswerId[i + 1]) {
        indexToAnswerId[i + 1] = aid
      }
    })
  }
  return indexToAnswerId
}

function scrollAndHighlightAnswer(answerId) {
  if (typeof document === 'undefined' || !answerId) return
  const el = document.getElementById(`answer-${answerId}`)
  if (!el) return
  try {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  } catch (_) {
    // ignore
  }
  try {
    el.animate(
      [
        { backgroundColor: 'rgba(250, 204, 21, 0.35)' },
        { backgroundColor: 'transparent' },
      ],
      { duration: 2000, iterations: 1, easing: 'ease-out' },
    )
  } catch (_) {
    // ignore
  }
}

/**
 * AI 摘要卡片组件
 * @param {Object} props
 * @param {string} props.content - Markdown 字符串
 * @param {'stable'|'outdated'|'regenerating'|'updated'} [props.status='stable']
 * @param {number} props.generatedAt - 首次生成时间戳
 * @param {number|null} [props.updatedAt] - 最后更新时间戳
 * @param {Array<{index:number, answerId:string, snippet?:string}>} [props.citations=[]]
 * @param {string[]} [props.sourceAnswerIds=[]]
 * @param {boolean} [props.isLoading=false] - regenerating 骨架屏
 * @param {(type:'helpful'|'needsUpdate'|'inaccurate')=>void} props.onFeedback
 */
export default function SummaryCard({
  content,
  status = 'stable',
  generatedAt,
  updatedAt,
  citations = [],
  sourceAnswerIds = [],
  isLoading = false,
  onFeedback,
}) {
  const showTime = updatedAt || generatedAt

  const citationMap = useMemo(
    () => buildCitationClickMap(content || '', citations, sourceAnswerIds),
    [content, citations, sourceAnswerIds],
  )

  const handleCitationClick = (e, indexStr) => {
    e.preventDefault()
    const index = parseInt(indexStr, 10)
    const answerId = citationMap[index]
    if (answerId) {
      scrollAndHighlightAnswer(answerId)
    }
  }

  const handleFeedbackHelpful = () => {
    if (typeof onFeedback === 'function') onFeedback('helpful')
  }
  const handleFeedbackNeedsUpdate = () => {
    if (typeof onFeedback === 'function') onFeedback('needsUpdate')
  }
  const handleFeedbackInaccurate = () => {
    if (typeof onFeedback === 'function') onFeedback('inaccurate')
  }

  const processedContent = content || ''

  return (
    <section
      aria-labelledby="ai-summary-title"
      className="rounded-xl border border-aif-border bg-aif-card p-5 shadow-sm sm:p-6"
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
          <StatusBadge status={isLoading ? 'regenerating' : status} />
          {showTime && (
            <span className="text-xs text-aif-muted-foreground">
              更新于 {timeAgoShort(showTime)}
            </span>
          )}
        </div>
      </div>

      <div className="text-sm leading-relaxed text-aif-card-foreground [&_a]:text-aif-primary [&_a]:underline [&_code]:bg-aif-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-[0.85em] [&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-gray-100 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_h1]:text-base [&_h1]:font-semibold [&_h1]:my-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:my-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-aif-border [&_blockquote]:pl-3 [&_blockquote]:text-aif-muted-foreground">
        {isLoading ? (
          <SkeletonLines />
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ node, children, ...props }) => {
                const href = props.href || ''
                const match = /^\[(\d+)\]$/.exec(String(children || ''))
                if (match) {
                  const n = match[1]
                  return (
                    <a
                      {...props}
                      href={`#citation-${n}`}
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
                        const n = m[1]
                        return (
                          <a
                            key={`cit-${i}-${j}`}
                            href={`#citation-${n}`}
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
            {processedContent}
          </ReactMarkdown>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleFeedbackHelpful}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded-md border border-aif-border bg-aif-muted px-3 py-1.5 text-xs font-medium text-aif-foreground hover:bg-aif-border transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <ThumbsUp className="h-3.5 w-3.5" />
          <span>有帮助</span>
        </button>
        <AiGate fallbackTooltip="AI 暂不可用，无法重新生成摘要" loading={isLoading}>
          <button
            type="button"
            onClick={handleFeedbackNeedsUpdate}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-md border border-aif-border bg-aif-muted px-3 py-1.5 text-xs font-medium text-aif-foreground hover:bg-aif-border transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>需要更新</span>
          </button>
        </AiGate>
        <button
          type="button"
          onClick={handleFeedbackInaccurate}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded-md border border-aif-border bg-aif-muted px-3 py-1.5 text-xs font-medium text-aif-foreground hover:bg-aif-border transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <XCircle className="h-3.5 w-3.5" />
          <span>不准确</span>
        </button>
      </div>
    </section>
  )
}
