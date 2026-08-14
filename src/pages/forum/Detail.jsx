import { useEffect, useRef, useState } from 'react'
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
  User,
  Loader2,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { fetchQuestionDetail, incrementView, createAnswer, toggleUpvote } from '../../services/questionRepository.js'
import * as aiService from '../../services/aiService.js'
import * as aiInteractionService from '../../services/aiInteractionService.js'
import * as behaviorService from '../../services/behaviorService.js'
import { useForumApp } from '../../contexts/ForumAppContext.jsx'

function timeAgo(ts) {
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

function MarkdownRenderer({ children }) {
  return (
    <div className="text-sm leading-relaxed text-aif-card-foreground [&_a]:text-aif-primary [&_a]:underline [&_code]:bg-aif-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-[0.85em] [&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-gray-100 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_h1]:text-base [&_h1]:font-semibold [&_h1]:my-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:my-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-aif-border [&_blockquote]:pl-3 [&_blockquote]:text-aif-muted-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}

export default function Detail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { identity } = useForumApp()
  const [question, setQuestion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [answer, setAnswer] = useState('')
  const [aiAutoGenerating, setAiAutoGenerating] = useState(false)
  const [aiStreamContent, setAiStreamContent] = useState('')
  const [aiError, setAiError] = useState(null)
  const [polishing, setPolishing] = useState(false)
  const [polishHint, setPolishHint] = useState('')
  const [upvoteMap, setUpvoteMap] = useState({})
  const [upvoteError, setUpvoteError] = useState(null)
  const abortRef = useRef(null)

  const loadQuestion = async () => {
    try {
      const res = await fetchQuestionDetail(id)
      if (!res) {
        setError('问题不存在')
      } else {
        setQuestion(res)
        try {
          behaviorService.recordView(res.id, res.tags || [])
        } catch (e) {
          // 行为信号记录失败不应阻断加载
        }
        const map = {}
        for (const a of res.answers || []) {
          if (a.isAI) continue
          map[a.id] = {
            upvotes: a.upvotes || 0,
            upvoted: behaviorService.hasUpvoted(a.id),
          }
        }
        setUpvoteMap(map)
        // 如果没有 AI 回答，自动生成
        autoAiAnswer(res)
      }
    } catch (err) {
      setError(err?.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuestion()
    incrementView(id).catch(() => {})
    return () => {
      abortRef.current?.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const autoAiAnswer = async (q) => {
    if (aiAutoGenerating) return
    const hasAiAnswer = (q.answers || []).some((a) => a.isAI)
    if (hasAiAnswer) return
    setAiAutoGenerating(true)
    setAiError(null)
    setAiStreamContent('')
    const start = performance.now()
    const controller = new AbortController()
    abortRef.current = controller
    try {
      let fullContent = ''
      const { mock } = await aiService.answerStream(
        {
          questionId: q.id,
          title: q.title,
          body: q.body,
          topAnswers: (q.answers || []).slice(0, 3).map((a) => a.content),
        },
        (delta) => {
          fullContent += delta
          setAiStreamContent(fullContent)
        },
        controller.signal,
      )
      // 直接发布为 AI 回答
      const newAnswer = await createAnswer(q.id, {
        content: fullContent,
        authorId: 'ai-system',
        authorName: 'AI 助手',
        authorAvatarSeed: '#5b6cff|#8b5cf6|135',
        isAi: true,
      })
      setQuestion((prev) =>
        prev
          ? { ...prev, answers: [...prev.answers, newAnswer], answerCount: prev.answerCount + 1 }
          : prev
      )
      aiInteractionService.record({ type: 'answer', success: true, mock, duration: performance.now() - start })
    } catch (err) {
      if (err?.name === 'AbortError') {
        // 组件卸载导致中断，不计为错误
      } else {
        aiInteractionService.record({ type: 'answer', success: false, mock: true, duration: performance.now() - start })
        setAiError(err?.message || 'AI 回答生成失败')
      }
    } finally {
      setAiAutoGenerating(false)
      setAiStreamContent('')
      abortRef.current = null
    }
  }

  const handlePolish = async () => {
    if (polishing) return
    if (!answer.trim()) {
      setPolishHint('请先输入内容再润色')
      return
    }
    setPolishHint('')
    setPolishing(true)
    const start = performance.now()
    try {
      const result = await aiService.polish({ type: 'body', text: answer })
      setAnswer(result.text)
      aiInteractionService.record({ type: 'polish', success: true, mock: result.mock, duration: performance.now() - start })
    } catch (err) {
      aiInteractionService.record({ type: 'polish', success: false, mock: true, duration: performance.now() - start })
      setPolishHint('润色失败：' + (err?.message || '未知错误'))
    } finally {
      setPolishing(false)
    }
  }

  const handleUpvote = async (a) => {
    if (!question) return
    setUpvoteError(null)
    const current = upvoteMap[a.id] || {
      upvotes: a.upvotes || 0,
      upvoted: behaviorService.hasUpvoted(a.id),
    }
    const direction = current.upvoted ? 'down' : 'up'
    const optimistic = {
      upvotes: Math.max(0, current.upvotes + (direction === 'up' ? 1 : -1)),
      upvoted: direction === 'up',
    }
    setUpvoteMap((prev) => ({ ...prev, [a.id]: optimistic }))
    try {
      const res = await toggleUpvote(id, a.id, direction)
      setUpvoteMap((prev) => ({
        ...prev,
        [a.id]: { upvotes: res.upvotes, upvoted: res.upvoted },
      }))
      // recordUpvote 自身为 toggle，成功调用后由其管理客户端去重
      behaviorService.recordUpvote(a.id, question.tags || [])
    } catch (err) {
      setUpvoteMap((prev) => ({ ...prev, [a.id]: current }))
      setUpvoteError('点赞失败，请稍后重试')
    }
  }

  const handlePublishAnswer = async () => {
    if (!answer.trim() || !identity) return
    try {
      const newAnswer = await createAnswer(id, {
        content: answer,
        authorId: identity.id,
        authorName: identity.nickname,
        authorAvatarSeed: identity.avatarSeed,
        isAi: false,
      })
      setQuestion(prev => prev ? { ...prev, answers: [...prev.answers, newAnswer], answerCount: prev.answerCount + 1 } : prev)
      setUpvoteMap((prev) => ({
        ...prev,
        [newAnswer.id]: { upvotes: newAnswer.upvotes || 0, upvoted: false },
      }))
      setAnswer('')
    } catch (err) {
      alert('发布失败：' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-20 text-aif-muted-foreground">加载中…</div>
    )
  }

  if (error || !question) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-aif-muted-foreground">{error || '问题不存在'}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-md bg-aif-primary px-4 py-2 text-sm font-semibold text-aif-primary-foreground hover:bg-aif-primary-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          返回首页
        </Link>
      </div>
    )
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
          {question.aiSummary && (
            <section className="rounded-lg border border-aif-border bg-aif-card p-5 shadow-sm" aria-label="AI 摘要">
              <div className="border-l-4 border-aif-primary pl-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-aif-primary px-2.5 py-0.5 text-xs font-semibold text-aif-primary-foreground">
                    AI 摘要
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-aif-success-bg px-2.5 py-0.5 text-xs font-medium text-aif-success">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>{question.aiSummary.status || '已生成'}</span>
                  </span>
                </div>
                <MarkdownRenderer>{question.aiSummary.content}</MarkdownRenderer>
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
          )}

          <article className="rounded-lg border border-aif-border bg-aif-card p-5 shadow-sm">
            <h1 className="text-xl font-bold leading-snug text-aif-foreground sm:text-2xl">
              {question.title}
            </h1>
            {question.tags?.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {question.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-aif-primary-50 px-2 py-0.5 text-xs font-medium text-aif-primary-700"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-5 space-y-4 text-aif-card-foreground">
              {question.body?.split('\n\n').map((p, i) => (
                <p key={i} className="leading-relaxed whitespace-pre-line">
                  {p}
                </p>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-aif-border pt-4 text-xs text-aif-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                <span>{(question.viewCount || 0).toLocaleString()} 次浏览</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>发布于 {timeAgo(question.createdAt)}</span>
              </span>
            </div>
          </article>

          <section className="flex flex-col gap-4" aria-label="回答列表">
            <h2 className="text-lg font-bold text-aif-foreground">{question.answers?.length || 0} 个回答</h2>
            {upvoteError && (
              <p className="text-xs text-aif-error">{upvoteError}</p>
            )}

            {aiAutoGenerating && (
              <article className="relative rounded-lg border border-aif-primary-200 bg-aif-primary-50 p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-aif-primary px-2 py-1 text-xs font-semibold text-aif-primary-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    AI 助手正在生成回答…
                  </span>
                </div>
                {aiStreamContent ? (
                  <MarkdownRenderer>{aiStreamContent}</MarkdownRenderer>
                ) : (
                  <p className="text-sm text-aif-muted-foreground">正在思考中…</p>
                )}
              </article>
            )}

            {(question.answers || []).map((a) => {
              const isAi = !!a.isAI
              const authorName = isAi ? 'AI 助手' : a.authorName
              const uv = upvoteMap[a.id] || { upvotes: a.upvotes || 0, upvoted: false }
              return (
                <article
                  key={a.id}
                  className={`relative rounded-lg border p-5 shadow-sm ${
                    isAi
                      ? 'border-aif-primary-200 bg-aif-primary-50'
                      : 'border-aif-border bg-aif-card'
                  }`}
                >
                  <div className="mb-3 flex items-center gap-2">
                    {isAi ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-aif-primary px-2 py-1 text-xs font-semibold text-aif-primary-foreground">
                        <Sparkles className="h-3 w-3" />
                        {authorName}
                      </span>
                    ) : (
                      <div className="inline-flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-aif-primary-300 to-aif-success text-white">
                          <User className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-medium text-aif-foreground">{authorName}</span>
                      </div>
                    )}
                    <span className="ml-auto text-xs text-aif-muted-foreground">{timeAgo(a.createdAt)}</span>
                  </div>
                  <MarkdownRenderer>{a.content}</MarkdownRenderer>
                  <div className="mt-4 flex items-center gap-4">
                    {!isAi && (
                      <button
                        type="button"
                        onClick={() => handleUpvote(a)}
                        aria-pressed={uv.upvoted}
                        className={`inline-flex items-center gap-1 text-xs transition-colors ${
                          uv.upvoted
                            ? 'text-aif-primary'
                            : 'text-aif-muted-foreground hover:text-aif-primary'
                        }`}
                      >
                        <ThumbsUp className={`h-3.5 w-3.5 ${uv.upvoted ? 'fill-aif-primary' : ''}`} />
                        <span>{uv.upvotes}</span>
                      </button>
                    )}
                    <button className="inline-flex items-center gap-1 text-xs text-aif-muted-foreground hover:text-aif-primary transition-colors">
                      <MessageCircle className="h-3.5 w-3.5" /> 回复
                    </button>
                  </div>
                </article>
              )
            })}
          </section>

          <section className="rounded-lg border border-aif-border bg-aif-card p-5 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-aif-foreground">撰写回答</h3>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handlePolish}
                  disabled={polishing || aiAutoGenerating}
                  className="inline-flex items-center gap-1.5 rounded-md border border-aif-border bg-aif-card px-3 py-1.5 text-xs font-medium text-aif-foreground hover:bg-aif-muted transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Wand2 className="h-3.5 w-3.5 text-aif-primary" />
                  <span>{polishing ? '润色中…' : 'AI 润色'}</span>
                </button>
              </div>
            </div>
            <textarea
              rows={6}
              value={answer}
              onChange={(e) => {
                setAnswer(e.target.value)
                if (e.target.value.trim() && polishHint) setPolishHint('')
              }}
              placeholder="输入你的回答，支持 Markdown 格式…"
              className="w-full resize-y rounded-lg border border-aif-input bg-aif-card px-4 py-3 text-base leading-relaxed text-aif-foreground placeholder:text-aif-muted-foreground focus:border-aif-primary focus:outline-none focus:ring-2 focus:ring-aif-primary/20"
            />
            {(aiError || polishHint) && (
              <div className="mt-2 text-xs">
                {aiError && <p className="text-aif-error">{aiError}</p>}
                {!aiError && polishHint && <p className="text-aif-warning">{polishHint}</p>}
              </div>
            )}
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
                onClick={handlePublishAnswer}
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
                数据持久化于 PostgreSQL + 本地 localStorage。点击导航栏右上角身份芯片可切换/清空匿名身份。
              </p>
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}
