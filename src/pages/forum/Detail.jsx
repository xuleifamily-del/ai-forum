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
  Square,
  Bot,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { fetchQuestionDetail, incrementView, createAnswer, toggleUpvote } from '../../services/questionRepository.js'
import * as aiService from '../../services/aiService.js'
import * as aiInteractionService from '../../services/aiInteractionService.js'
import * as behaviorService from '../../services/behaviorService.js'
import { retrieveTopAnswers, parseCitations } from '../../services/reverseRagService.js'
import { useForumApp } from '../../contexts/ForumAppContext.jsx'
import SummaryCard from '../../components/forum/SummaryCard.jsx'
import apiClient from '../../services/apiClient.js'
import localFlagService from '../../services/localFlagService.js'
import degradationService from '../../services/degradationService.js'
import * as notificationService from '../../services/notificationService.js'
import StorageService from '../../services/storageService.js'
import { STORAGE_KEYS } from '../../constants/forumStorageKeys.js'

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
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiError, setAiError] = useState(null)
  const [polishing, setPolishing] = useState(false)
  const [polishHint, setPolishHint] = useState('')
  const [upvoteMap, setUpvoteMap] = useState({})
  const [upvoteError, setUpvoteError] = useState(null)
  const abortRef = useRef(null)
  const summaryStatusTimerRef = useRef(null)
  const autoAnswerFiredRef = useRef(false)
  const pollRef = useRef(null) // AI 回答自动出现轮询定时器
  const lastClickTsRef = useRef(0)
  const [autoAnswerText, setAutoAnswerText] = useState('')
  const [autoAnswerGenerating, setAutoAnswerGenerating] = useState(false)
  const [autoAnswerError, setAutoAnswerError] = useState(null)

  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const { aiState } = degradationService.getState()

  const clearSummaryStatusTimer = () => {
    if (summaryStatusTimerRef.current) {
      clearTimeout(summaryStatusTimerRef.current)
      summaryStatusTimerRef.current = null
    }
  }

  const runGenerateAndPersistSummary = async (q, showLoading = true) => {
    if (!q) return
    const start = performance.now()
    if (showLoading) {
      setSummaryLoading(true)
      setSummary((prev) => (prev ? { ...prev, status: 'regenerating' } : null))
    }
    try {
      const answersForSummary = Array.isArray(q.answers)
        ? q.answers.filter((a) => !a.isAI).slice(0, 5)
        : []
      const topAnswers =
        answersForSummary.length >= 2
          ? answersForSummary
          : retrieveTopAnswers({
              questionId: q.id,
              title: q.title,
              body: q.body,
              tags: q.tags || [],
              n: 5,
            }).map((ra) => ({ id: ra.id, content: ra.content }))
      const sourceAnswerIds = topAnswers.map((a) => a.id)
      const { content, citations: rawCitations, mock } = await aiService.generateSummary({
        questionId: q.id,
        title: q.title,
        body: q.body,
        topAnswers,
      })
      const parsedCitations = parseCitations(content, sourceAnswerIds)
      const mergedCitations = Array.isArray(rawCitations) && rawCitations.length > 0
        ? rawCitations
        : parsedCitations
      const stored = await aiService.upsertSummaryToStorage({
        questionId: q.id,
        content,
        sourceAnswerIds,
        citations: mergedCitations,
        status: 'updated',
      })
      setSummary(stored)
      if (document.hidden) {
        notificationService.notifySummaryReady({ questionId: q.id, title: q.title })
      }
      aiInteractionService.record({
        type: 'summary',
        success: true,
        mock,
        duration: performance.now() - start,
        targetId: q.id,
      })
      clearSummaryStatusTimer()
      summaryStatusTimerRef.current = setTimeout(() => {
        setSummary((prev) => (prev ? { ...prev, status: 'stable' } : prev))
      }, 30_000)
    } catch (err) {
      aiInteractionService.record({
        type: 'summary',
        success: false,
        mock: true,
        duration: performance.now() - start,
        targetId: q.id,
      })
      setSummary((prev) => (prev ? { ...prev, status: 'outdated' } : null))
    } finally {
      setSummaryLoading(false)
    }
  }

  const loadSummaryForQuestion = async (q) => {
    if (!q) return
    const local = aiService.getLocalSummary(q.id)
    if (local) {
      setSummary(local)
    }
    let remote = null
    try {
      remote = await apiClient.get(`/questions/${q.id}/summary`)
    } catch (_) {
      remote = null
    }
    if (remote && remote.content) {
      const newer =
        !local || (remote.updatedAt && local.updatedAt && remote.updatedAt > local.updatedAt)
      if (newer) {
        try {
          const map = StorageService.get(STORAGE_KEYS.SUMMARIES) || {}
          map[q.id] = remote
          StorageService.set(STORAGE_KEYS.SUMMARIES, map)
        } catch (_) {
          // ignore
        }
        setSummary(remote)
        return
      }
    }
    if (!local && !remote) {
      const nonAiAnswers = (q.answers || []).filter((a) => !a.isAI)
      if (nonAiAnswers.length >= 2) {
        runGenerateAndPersistSummary(q, false)
      }
    }
  }

  const runAiAnswerCore = async (options = {}) => {
    const { auto = false } = options
    if (!question) return { mock: false, content: '' }

    const setContent = auto ? setAutoAnswerText : setAnswer
    const setGen = auto ? setAutoAnswerGenerating : setIsGenerating
    const setErr = auto ? setAutoAnswerError : setAiError

    if (!auto && isGenerating) return { mock: false, content: '' }
    if (auto && autoAnswerGenerating) return { mock: false, content: '' }

    setGen(true)
    setErr(null)
    setContent('')
    const start = performance.now()
    const controller = new AbortController()
    if (!auto) {
      abortRef.current = controller
    }
    let finalContent = ''
    let mockFlag = false
    let topAnswersForSource = []

    try {
      topAnswersForSource = retrieveTopAnswers({
        questionId: id,
        title: question.title,
        body: question.body,
        tags: question.tags || [],
        n: 3,
      })

      const topAnswersContent = topAnswersForSource.map((a) => a.content)

      const { mock } = await aiService.answerStream(
        {
          questionId: id,
          title: question.title,
          body: question.body,
          topAnswers: topAnswersContent,
        },
        (delta) => {
          finalContent += delta
          setContent((prev) => prev + delta)
        },
        auto ? undefined : controller.signal,
      )
      mockFlag = mock

      aiInteractionService.record({
        type: 'answer',
        success: true,
        mock,
        duration: performance.now() - start,
        subType: auto ? 'auto-initial' : undefined,
      })

      return { mock: mockFlag, content: finalContent, sourceAnswerIds: topAnswersForSource.map((a) => a.id) }
    } catch (err) {
      if (err?.name === 'AbortError') {
        // 用户主动停止，不计为错误
      } else {
        aiInteractionService.record({
          type: 'answer',
          success: false,
          mock: true,
          duration: performance.now() - start,
          subType: auto ? 'auto-initial' : undefined,
        })
        setErr(err?.message || 'AI 回答生成失败')

        if (auto) {
          degradationService.addPendingTask({
            id: `init-answer-${id}`,
            type: 'answer',
            questionId: id,
            payload: {
              questionId: id,
              title: question.title,
              body: question.body,
              topAnswers: topAnswersForSource.map((a) => a.content),
            },
          })
        }
      }
      throw err
    } finally {
      setGen(false)
      if (!auto) {
        abortRef.current = null
      }
    }
  }

  const stopAiAnswerPoll = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  const startAiAnswerPoll = (q) => {
    stopAiAnswerPoll()
    let ticks = 0
    const MAX_TICKS = 30 // 最多轮询 30 * 2s = 60s
    pollRef.current = setInterval(async () => {
      ticks += 1
      try {
        const fresh = await fetchQuestionDetail(q.id)
        const aiAnswer = (fresh?.answers || []).find((a) => a.isAI)
        if (aiAnswer) {
          // 后端已生成 AI 回答，合并到本地 state
          setQuestion((prev) => {
            if (!prev) return fresh
            const existing = new Set((prev.answers || []).map((a) => a.id))
            const mergedAnswers = Array.isArray(fresh.answers)
              ? [
                  ...(prev.answers || []).filter((a) => !a.isAI),
                  ...fresh.answers.filter((a) => a.isAI || !existing.has(a.id)),
                ]
              : (prev.answers || [])
            return { ...prev, answers: mergedAnswers, answerCount: fresh.answerCount ?? prev.answerCount }
          })
          stopAiAnswerPoll()
        }
      } catch (_) {
        // 轮询出错不抛异常，静默重试直到达到上限
      }
      if (ticks >= MAX_TICKS) {
        stopAiAnswerPoll()
      }
    }, 2000)
  }

  const triggerAutoAiAnswer = async (q) => {
    // 启动后端轮询兜底（即使前端流式中断/失败，后端生成的回答也会出现）
    startAiAnswerPoll(q)
    try {
      const { content, sourceAnswerIds } = await runAiAnswerCore({ auto: true })
      if (content && content.trim()) {
        const newAnswer = await createAnswer(id, {
          content,
          authorId: 'ai-system',
          authorName: 'AI 助手',
          authorAvatarSeed: '#5b6cff|#8b5cf6|135',
          isAi: true,
          aiSourceAnswerIds: sourceAnswerIds,
        })
        setQuestion((prev) =>
          prev
            ? {
                ...prev,
                answers: [...prev.answers, newAnswer],
                answerCount: prev.answerCount + 1,
              }
            : prev
        )
        setAutoAnswerText('')
        stopAiAnswerPoll()
      }
    } catch (err) {
      // 错误已在 runAiAnswerCore 中处理；保持轮询等待后端兜底生成
    }
  }

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
        loadSummaryForQuestion(res)

        const hasAIAnswer = (res.answers || []).some((a) => a.isAI)
        const alreadyTriggered = localFlagService.getFlag(`ai-init:${id}`)
        const currentAiState = degradationService.getState().aiState

        if (
          !loading &&
          !error &&
          res &&
          !hasAIAnswer &&
          !alreadyTriggered &&
          !autoAnswerFiredRef.current
        ) {
          autoAnswerFiredRef.current = true
          localFlagService.setFlag(`ai-init:${id}`, true)
          if (currentAiState === 'unavailable') {
            degradationService.addPendingTask({
              id: `init-answer-${id}`,
              type: 'answer',
              questionId: id,
              payload: {
                questionId: id,
                title: res.title,
                body: res.body,
                topAnswers: (res.answers || []).slice(0, 3).map((a) => a.content),
              },
            })
          } else {
            setTimeout(() => triggerAutoAiAnswer(res), 300)
          }
        }
      }
    } catch (err) {
      setError(err?.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    aiInteractionService.markSessionEligible('detail')
    loadQuestion()
    incrementView(id).catch(() => {})
    return () => {
      abortRef.current?.abort()
      clearSummaryStatusTimer()
      stopAiAnswerPoll()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleAiAnswer = async () => {
    if (isGenerating) return
    if (lastClickTsRef.current && Date.now() - lastClickTsRef.current < 500) return
    lastClickTsRef.current = Date.now()
    if (notificationService.getPermission() === 'default') {
      notificationService.requestPermission()
    }
    try {
      await runAiAnswerCore({ auto: false })
    } catch (_) {
    }
  }

  const handleStopGenerate = () => {
    abortRef.current?.abort()
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

  const handleSummaryFeedback = async (type) => {
    if (!question) return
    if (summaryLoading) return
    if (lastClickTsRef.current && Date.now() - lastClickTsRef.current < 500) return
    lastClickTsRef.current = Date.now()
    aiInteractionService.record({
      type: 'feedback',
      success: true,
      mock: false,
      targetId: question.id,
      feedbackType: type,
    })
    aiInteractionService.recordFeedback({
      questionId: question.id,
      summaryId: summary?.id,
      type,
    })
    await aiService.submitSummaryFeedback({
      questionId: question.id,
      summaryId: summary?.id,
      type,
    })
    if (type === 'needsUpdate') {
      if (notificationService.getPermission() === 'default') {
        notificationService.requestPermission()
      }
      runGenerateAndPersistSummary(question, true)
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-6">
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

          {(summary || summaryLoading) && (
            <SummaryCard
              content={summary?.content || ''}
              status={summary?.status || 'stable'}
              generatedAt={summary?.generatedAt}
              updatedAt={summary?.updatedAt}
              citations={summary?.citations || []}
              sourceAnswerIds={summary?.sourceAnswerIds || []}
              isLoading={summaryLoading && !summary?.content}
              onFeedback={handleSummaryFeedback}
            />
          )}

          <section className="flex flex-col gap-4" aria-label="回答列表">
            <h2 className="text-lg font-bold text-aif-foreground">{question.answers?.length || 0} 个回答</h2>
            {upvoteError && (
              <p className="text-xs text-aif-error">{upvoteError}</p>
            )}

            {autoAnswerError && (
              <div className="rounded-lg border border-aif-error/30 bg-aif-error/5 p-3">
                <p className="text-xs text-aif-error">
                  AI 初始回答生成失败，稍后可点击下方「AI 帮我答」按钮重试
                </p>
              </div>
            )}

            {(autoAnswerGenerating || autoAnswerText) && !autoAnswerError && (
              <article
                className="relative rounded-lg border p-5 shadow-sm bg-aif-primary-50"
                style={{ borderLeft: '4px solid #5b6cff' }}
              >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-aif-primary-100 to-aif-primary-200 text-aif-primary">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-md bg-aif-primary px-2 py-1 text-xs font-semibold text-aif-primary-foreground">
                    <Sparkles className="h-3 w-3" />
                    AI 助手
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-aif-primary-100 px-2.5 py-0.5 text-[10px] font-medium text-aif-primary">
                    <CheckCircle2 className="h-3 w-3" />
                    AI 生成·综合社区内容
                  </span>
                  {autoAnswerGenerating && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-aif-muted-foreground">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      生成中…
                    </span>
                  )}
                  <span className="ml-auto text-xs text-aif-muted-foreground">刚刚</span>
                </div>
                <MarkdownRenderer>{autoAnswerText}</MarkdownRenderer>
              </article>
            )}

            {(question.answers || []).map((a) => {
              const isAi = !!a.isAI
              const authorName = isAi ? 'AI 助手' : a.authorName
              const uv = upvoteMap[a.id] || { upvotes: a.upvotes || 0, upvoted: false }
              return (
                <article
                  key={a.id}
                  id={`answer-${a.id}`}
                  className={`relative rounded-lg border p-4 shadow-sm sm:p-5 ${
                    isAi
                      ? 'bg-aif-primary-50'
                      : 'border-aif-border bg-aif-card'
                  }`}
                  style={isAi ? { borderLeft: '4px solid #5b6cff' } : undefined}
                >
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    {isAi ? (
                      <>
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-aif-primary-100 to-aif-primary-200 text-aif-primary">
                          <Bot className="h-3.5 w-3.5" />
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-md bg-aif-primary px-2 py-1 text-xs font-semibold text-aif-primary-foreground">
                          <Sparkles className="h-3 w-3" />
                          {authorName}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-aif-primary-100 px-2.5 py-0.5 text-[10px] font-medium text-aif-primary">
                          <CheckCircle2 className="h-3 w-3" />
                          AI 生成·综合社区内容
                        </span>
                      </>
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
                {isGenerating ? (
                  <button
                    type="button"
                    onClick={handleStopGenerate}
                    className="inline-flex items-center gap-1.5 rounded-md border border-aif-border bg-aif-card px-3 py-1.5 text-xs font-medium text-aif-foreground hover:bg-aif-muted transition-colors min-w-[44px] min-h-[44px]"
                  >
                    <Square className="h-3.5 w-3.5 text-aif-error" />
                    <span>停止</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (isGenerating) return
                      handleAiAnswer()
                    }}
                    disabled={isGenerating || aiState === 'unavailable'}
                    className="inline-flex items-center gap-1.5 rounded-md border border-aif-border bg-aif-card px-3 py-1.5 text-xs font-medium text-aif-foreground hover:bg-aif-muted transition-colors disabled:opacity-60 disabled:cursor-not-allowed min-w-[44px] min-h-[44px]"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-aif-primary" />
                    <span>AI 帮我答</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handlePolish}
                  disabled={polishing || isGenerating || aiState === 'unavailable'}
                  className="inline-flex items-center gap-1.5 rounded-md border border-aif-border bg-aif-card px-3 py-1.5 text-xs font-medium text-aif-foreground hover:bg-aif-muted transition-colors disabled:opacity-60 disabled:cursor-not-allowed min-w-[44px] min-h-[44px]"
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
              className="w-full resize-y rounded-lg border border-aif-input bg-aif-card p-3 sm:px-4 sm:py-3 text-base leading-relaxed text-aif-foreground placeholder:text-aif-muted-foreground focus:border-aif-primary focus:outline-none focus:ring-2 focus:ring-aif-primary/20"
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
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-aif-border bg-aif-card px-5 py-2.5 text-sm font-semibold text-aif-foreground hover:bg-aif-muted transition-colors w-full sm:w-auto min-w-[44px] min-h-[44px]"
              >
                清空
              </button>
              <button
                type="button"
                onClick={handlePublishAnswer}
                disabled={!answer.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-aif-primary px-5 py-2.5 text-sm font-semibold text-aif-primary-foreground hover:bg-aif-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto sm:min-w-[120px] min-h-[44px]"
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
                className="block w-full rounded-lg border border-aif-border bg-aif-primary px-4 py-3 text-center text-sm font-semibold text-aif-primary-foreground hover:bg-aif-primary-600 transition-colors min-h-[44px]"
              >
                基于此问题提问新帖
              </Link>
              <button className="w-full rounded-lg border border-aif-border bg-aif-muted px-4 py-3 text-sm font-medium text-aif-foreground hover:bg-aif-border transition-colors min-h-[44px]">
                收藏问题
              </button>
              <button className="w-full rounded-lg border border-aif-border bg-aif-muted px-4 py-3 text-sm font-medium text-aif-foreground hover:bg-aif-border transition-colors min-h-[44px]">
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
