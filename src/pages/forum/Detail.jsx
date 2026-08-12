import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  ThumbsUp,
  RefreshCw,
  Eye,
  Clock,
  MessageCircle,
  Send,
  Wand2,
  Copy,
  User,
} from 'lucide-react'
import { questionDetail } from './mockData.js'

export default function Detail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [answer, setAnswer] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  const q = questionDetail

  const handleCopy = () => {
    navigator.clipboard.writeText(q.codeSnippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleAiAnswer = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setAnswer('根据问题分析，这通常是因为依赖中的对象引用不稳定导致的。建议：\n1. 在父组件用 useMemo 包装 filter 对象\n2. 或使用自定义 useDeepCompareEffect hook 做深度比较\n3. 检查 React 18 StrictMode 的双调用是否影响判断')
      setIsGenerating(false)
    }, 800)
  }

  return (
    <>
      <div className="border-b border-aif-border bg-aif-card -mx-4 -mt-6 px-4 py-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 mb-6">
        <div className="mx-auto max-w-6xl">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-aif-muted-foreground hover:text-aif-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>返回首页</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className="rounded-lg border border-aif-border bg-aif-card p-5 shadow-sm" aria-label="AI 摘要">
            <div className="border-l-4 border-aif-primary pl-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-aif-primary px-2.5 py-0.5 text-xs font-semibold text-aif-primary-foreground">
                  AI 摘要
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-aif-success-bg px-2.5 py-0.5 text-xs font-medium text-aif-success">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>状态稳定</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed text-aif-card-foreground">
                {q.aiSummary.split(/(\[.\])/g).map((part, i) => {
                  const m = part.match(/^\[(\d)\]$/)
                  if (m) {
                    return (
                      <a
                        key={i}
                        href={`#ref-${m[1]}`}
                        className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded bg-aif-primary-100 px-1 text-xs font-semibold text-aif-primary-700 hover:underline mx-0.5"
                      >
                        [{m[1]}]
                      </a>
                    )
                  }
                  const withCode = part.split(/(useMemo|useCallback|eslint-plugin-react-hooks|exhaustive-deps)/g).map((seg, j) => {
                    if (['useMemo', 'useCallback', 'eslint-plugin-react-hooks', 'exhaustive-deps'].includes(seg)) {
                      return (
                        <code
                          key={j}
                          className="rounded bg-aif-muted px-1 py-0.5 font-aif-mono text-xs"
                        >
                          {seg}
                        </code>
                      )
                    }
                    return <span key={j}>{seg}</span>
                  })
                  return <span key={i}>{withCode}</span>
                })}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-md border border-aif-border bg-aif-muted px-3 py-1.5 text-xs font-medium text-aif-foreground hover:bg-aif-border transition-colors"
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  <span>有帮助</span>
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-md border border-aif-border bg-aif-muted px-3 py-1.5 text-xs font-medium text-aif-foreground hover:bg-aif-border transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>需更新</span>
                </button>
              </div>
            </div>
          </section>

          <article className="rounded-lg border border-aif-border bg-aif-card p-5 shadow-sm">
            <h1 className="text-xl font-bold leading-snug text-aif-foreground sm:text-2xl">
              {q.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {q.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-md bg-aif-primary-50 px-2 py-0.5 text-xs font-medium text-aif-primary-700"
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-5 space-y-4 text-aif-card-foreground">
              {q.content.split('\n\n').map((p, i) => (
                <p key={i} className="leading-relaxed whitespace-pre-line">
                  {p.includes('useEffect') || p.includes('useState') ? (
                    p.split(/(useEffect|useState|filter|setFilter)/g).map((seg, j) => {
                      if (['useEffect', 'useState', 'filter', 'setFilter'].includes(seg)) {
                        return (
                          <code
                            key={j}
                            className="rounded bg-aif-muted px-1 py-0.5 font-aif-mono text-sm"
                          >
                            {seg}
                          </code>
                        )
                      }
                      return <span key={j}>{seg}</span>
                    })
                  ) : (
                    p
                  )}
                </p>
              ))}

              <div className="overflow-hidden rounded-lg border border-aif-border bg-aif-muted">
                <div className="flex items-center justify-between border-b border-aif-border bg-aif-muted px-4 py-2">
                  <span className="text-xs font-medium text-aif-muted-foreground">示例代码</span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="text-xs font-medium text-aif-muted-foreground hover:text-aif-primary transition-colors"
                  >
                    {copied ? '已复制' : '复制'}
                  </button>
                </div>
                <pre className="overflow-x-auto p-4 text-sm leading-relaxed font-aif-mono">
                  <code className="text-aif-foreground">{q.codeSnippet}</code>
                </pre>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-aif-border pt-4 text-xs text-aif-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                <span>{q.views.toLocaleString()} 次浏览</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>发布于 {q.createdAt}</span>
              </span>
            </div>
          </article>

          <section className="flex flex-col gap-4" aria-label="回答列表">
            <h2 className="text-lg font-bold text-aif-foreground">{q.answers.length} 个回答</h2>

            {q.answers.map((a) => (
              <article
                key={a.id}
                className={`relative rounded-lg border p-5 shadow-sm ${
                  a.type === 'ai'
                    ? 'border-aif-primary-200 bg-aif-primary-50'
                    : 'border-aif-border bg-aif-card'
                }`}
              >
                <div className="mb-3 flex items-center gap-2">
                  {a.type === 'ai' ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-aif-primary px-2 py-1 text-xs font-semibold text-aif-primary-foreground">
                      <Sparkles className="h-3 w-3" />
                      {a.title}
                    </span>
                  ) : (
                    <div className="inline-flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-aif-primary-300 to-aif-success text-white">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-medium text-aif-foreground">{a.author}</span>
                    </div>
                  )}
                  <span className="ml-auto text-xs text-aif-muted-foreground">{a.createdAt}</span>
                </div>
                <p className="text-sm leading-relaxed text-aif-card-foreground">{a.content}</p>
                <div className="mt-4 flex items-center gap-4">
                  {a.type === 'ai' ? (
                    a.helpful ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-aif-success-bg px-2.5 py-0.5 text-xs font-medium text-aif-success">
                        <CheckCircle2 className="h-3 w-3" /> 已采用为草稿
                      </span>
                    ) : null
                  ) : (
                    <button className="inline-flex items-center gap-1 text-xs text-aif-muted-foreground hover:text-aif-primary transition-colors">
                      <ThumbsUp className="h-3.5 w-3.5" /> {a.likes}
                    </button>
                  )}
                  <button className="inline-flex items-center gap-1 text-xs text-aif-muted-foreground hover:text-aif-primary transition-colors">
                    <MessageCircle className="h-3.5 w-3.5" /> 回复
                  </button>
                </div>
              </article>
            ))}
          </section>

          <section className="rounded-lg border border-aif-border bg-aif-card p-5 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-aif-foreground">撰写回答</h3>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAiAnswer}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1.5 rounded-md border border-aif-border bg-aif-card px-3 py-1.5 text-xs font-medium text-aif-foreground hover:bg-aif-muted transition-colors disabled:opacity-60"
                >
                  <Sparkles className="h-3.5 w-3.5 text-aif-primary" />
                  {isGenerating ? '生成中…' : 'AI 帮我答'}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-md border border-aif-border bg-aif-card px-3 py-1.5 text-xs font-medium text-aif-foreground hover:bg-aif-muted transition-colors"
                >
                  <Wand2 className="h-3.5 w-3.5 text-aif-primary" />
                  AI 润色
                </button>
              </div>
            </div>
            <textarea
              rows={6}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="输入你的回答，支持 Markdown 格式…"
              className="w-full resize-y rounded-lg border border-aif-input bg-aif-card px-4 py-3 text-base leading-relaxed text-aif-foreground placeholder:text-aif-muted-foreground focus:border-aif-primary focus:outline-none focus:ring-2 focus:ring-aif-primary/20"
            />
            <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={() => setAnswer('')}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-aif-border bg-aif-card px-5 py-2.5 text-sm font-semibold text-aif-foreground hover:bg-aif-muted transition-colors"
              >
                清空
              </button>
              <button
                type="button"
                disabled={!answer.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-aif-primary px-5 py-2.5 text-sm font-semibold text-aif-primary-foreground hover:bg-aif-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
                发布回答
              </button>
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-xl border border-aif-border bg-aif-card p-5 shadow-sm sticky top-24">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-aif-primary" />
              <h2 className="text-base font-semibold text-aif-foreground">AI 快速操作</h2>
            </div>
            <div className="space-y-2">
              <Link
                to="/ask"
                className="block w-full rounded-lg border border-aif-border bg-aif-primary px-4 py-3 text-center text-sm font-semibold text-aif-primary-foreground hover:bg-aif-primary-600 transition-colors"
              >
                基于此问题提问新帖
              </Link>
              <button className="w-full rounded-lg border border-aif-border bg-aif-muted px-4 py-3 text-sm font-medium text-aif-foreground hover:bg-aif-border transition-colors">
                收藏问题
              </button>
              <button className="w-full rounded-lg border border-aif-border bg-aif-muted px-4 py-3 text-sm font-medium text-aif-foreground hover:bg-aif-border transition-colors">
                分享链接
              </button>
            </div>
            <div className="mt-6 border-t border-aif-border pt-4">
              <p className="text-xs text-aif-muted-foreground">
                数据保存在本地 localStorage。点击导航栏右上角身份芯片可切换/清空匿名身份。
              </p>
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}
