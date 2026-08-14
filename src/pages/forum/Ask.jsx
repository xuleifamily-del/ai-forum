import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createQuestion, fetchQuestions } from '../../services/questionRepository.js'
import * as aiService from '../../services/aiService.js'
import { record as recordAiInteraction } from '../../services/aiInteractionService.js'
import { useForumApp } from '../../contexts/ForumAppContext.jsx'
import AiGate from '../../components/forum/AiGate.jsx'
import useDebounce from '../../hooks/useDebounce.js'
import {
  Sparkles,
  Text,
  FilePlus,
  Hash,
  Send,
  FileQuestion,
  CheckCircle2,
  X,
  AlertTriangle,
} from 'lucide-react'

const recommendTags = ['React', 'TypeScript', 'Tailwind CSS', 'Node.js']

const tips = [
  '标题尽量简洁明确，避免模糊词汇。',
  '正文补充环境、报错信息和已尝试方案。',
  '添加标签有助于他人快速发现你的问题。',
]

export default function Ask() {
  const navigate = useNavigate()
  const { identity, aiAvailable, user } = useForumApp()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [showPolishHint, setShowPolishHint] = useState(false)
  const [polishSuggestion, setPolishSuggestion] = useState('')
  const [polishMock, setPolishMock] = useState(false)
  const [similarQuestions, setSimilarQuestions] = useState([])
  const [aiLoading, setAiLoading] = useState(null)
  const [aiError, setAiError] = useState(null)
  const [aiNotice, setAiNotice] = useState(null)
  const [publishing, setPublishing] = useState(false)
  const [showVaguenessHint, setShowVaguenessHint] = useState(false)
  const [lastVaguenessCheckedText, setLastVaguenessCheckedText] = useState('')
  const [vaguenessResult, setVaguenessResult] = useState(null)

  const debouncedTitle = useDebounce(title, 800)

  const _runVaguenessCheck = useCallback((titleText, { force = false } = {}) => {
    const trimmed = titleText.trim()
    if (trimmed.length === 0) return
    if (!force && trimmed === lastVaguenessCheckedText) return
    const result = aiService.detectVagueness(trimmed)
    setVaguenessResult(result)
    if (result.isVague) {
      setShowVaguenessHint(true)
      setLastVaguenessCheckedText(trimmed)
    }
  }, [lastVaguenessCheckedText])

  useEffect(() => {
    if (debouncedTitle.length === 0) return
    if (debouncedTitle === lastVaguenessCheckedText) return
    _runVaguenessCheck(debouncedTitle, { force: false })
  }, [debouncedTitle, lastVaguenessCheckedText, _runVaguenessCheck])

  useEffect(() => {
    if (!showVaguenessHint) return
    const id = window.setInterval(() => {
      setShowVaguenessHint(false)
      window.clearInterval(id)
    }, 5000)
    return () => window.clearInterval(id)
  }, [showVaguenessHint])

  const handlePolishTitleFromHint = async () => {
    if (!title.trim()) return
    const start = performance.now()
    setAiLoading('polish-title')
    setAiError(null)
    try {
      const result = await aiService.polish({ type: 'title', text: title })
      if (result && typeof result.text === 'string' && result.text.trim()) {
        setTitle(result.text.trim())
      }
      setShowVaguenessHint(false)
      const mock = result?.mock === true
      if (mock) setAiNotice('模拟回复·离线演示')
      const duration = Math.round(performance.now() - start)
      recordAiInteraction({ type: 'polish', success: true, mock, duration, subType: 'vaguenessHint' })
    } catch (err) {
      const duration = Math.round(performance.now() - start)
      recordAiInteraction({ type: 'polish', success: false, mock: true, duration, subType: 'vaguenessHint' })
      setAiError(err.message || 'AI 润色失败')
    } finally {
      setAiLoading(null)
    }
  }

  // 错误提示 5s 后自动清除（使用 setInterval 自清除实现一次性延时，避免使用 setTimeout）
  useEffect(() => {
    if (!aiError) return
    const id = window.setInterval(() => {
      setAiError(null)
      window.clearInterval(id)
    }, 5000)
    return () => window.clearInterval(id)
  }, [aiError])

  // mock 提示 4s 后自动清除
  useEffect(() => {
    if (!aiNotice) return
    const id = window.setInterval(() => {
      setAiNotice(null)
      window.clearInterval(id)
    }, 4000)
    return () => window.clearInterval(id)
  }, [aiNotice])

  const handleTagKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const v = tagInput.trim().replace(/,/g, '')
      if (v && tags.length < 5 && !tags.includes(v)) {
        setTags([...tags, v])
      }
      setTagInput('')
    } else if (e.key === 'Backspace' && !tagInput && tags.length) {
      setTags(tags.slice(0, -1))
    }
  }

  const removeTag = (t) => setTags(tags.filter((x) => x !== t))
  const addRecTag = (t) => {
    if (tags.length < 5 && !tags.includes(t)) setTags([...tags, t])
  }

  const handlePublish = async () => {
    if (!title.trim() || !body.trim() || !user) return
    setPublishing(true)
    try {
      const question = await createQuestion({
        title: title.trim(),
        body: body.trim(),
        tags,
        authorId: user.id,
        authorName: user.username,
        authorAvatarSeed: identity?.avatarSeed || '#5b6cff|#14b585|135',
        aiAssisted: false,
      })
      navigate(`/detail/${question.id}`)
    } catch (err) {
      setAiError('发布失败：' + (err.message || '未知错误'))
    } finally {
      setPublishing(false)
    }
  }

  // —— AI 润色正文 ——
  const handlePolishBody = async () => {
    if (!body.trim()) return
    const start = performance.now()
    setAiLoading('polish')
    setAiError(null)
    try {
      const result = await aiService.polish({ type: 'body', text: body })
      setBody(result.text)
      if (result.mock) setAiNotice('模拟回复·离线演示')
      const duration = Math.round(performance.now() - start)
      recordAiInteraction({ type: 'polish', success: true, mock: !!result.mock, duration })
    } catch (err) {
      const duration = Math.round(performance.now() - start)
      recordAiInteraction({ type: 'polish', success: false, mock: true, duration })
      setAiError(err.message || 'AI 润色失败')
    } finally {
      setAiLoading(null)
    }
  }

  // —— AI 扩写 ——
  const handleExpand = async () => {
    const start = performance.now()
    setAiLoading('expand')
    setAiError(null)
    try {
      const result = await aiService.expand({ title, body })
      setBody(result.text)
      if (result.mock) setAiNotice('模拟回复·离线演示')
      const duration = Math.round(performance.now() - start)
      recordAiInteraction({ type: 'expand', success: true, mock: !!result.mock, duration })
    } catch (err) {
      const duration = Math.round(performance.now() - start)
      recordAiInteraction({ type: 'expand', success: false, mock: true, duration })
      setAiError(err.message || 'AI 扩写失败')
    } finally {
      setAiLoading(null)
    }
  }

  // —— 生成草稿 ——
  const handleDraft = async () => {
    const start = performance.now()
    setAiLoading('draft')
    setAiError(null)
    try {
      const result = await aiService.draft({ intent: 'question', title, body })
      setBody(result.text)
      if (result.mock) setAiNotice('模拟回复·离线演示')
      const duration = Math.round(performance.now() - start)
      recordAiInteraction({ type: 'draft', success: true, mock: !!result.mock, duration })
    } catch (err) {
      const duration = Math.round(performance.now() - start)
      recordAiInteraction({ type: 'draft', success: false, mock: true, duration })
      setAiError(err.message || '生成草稿失败')
    } finally {
      setAiLoading(null)
    }
  }

  // —— 标题失焦：模糊检测 + 相似问题 ——
  const handleTitleBlur = async () => {
    const trimmed = title.trim()
    _runVaguenessCheck(trimmed, { force: false })
    if (trimmed.length < 2) {
      setShowPolishHint(false)
      setPolishSuggestion('')
      setSimilarQuestions([])
      return
    }

    // 1. 模糊检测：调用 polish 生成建议
    const start = performance.now()
    try {
      const result = await aiService.polish({ type: 'title', text: title })
      const suggestion = (result.text || '').trim()
      if (suggestion && suggestion.toLowerCase() !== trimmed.toLowerCase()) {
        setPolishSuggestion(suggestion)
        setPolishMock(result.mock === true)
        setShowPolishHint(true)
      } else {
        setShowPolishHint(false)
        setPolishSuggestion('')
      }
      const duration = Math.round(performance.now() - start)
      recordAiInteraction({ type: 'polish', success: true, mock: !!result.mock, duration })
    } catch (err) {
      const duration = Math.round(performance.now() - start)
      recordAiInteraction({ type: 'polish', success: false, mock: true, duration })
      // 标题失焦的失败不弹错误提示，避免打扰输入流
    }

    // 2. 相似问题：客户端过滤（后端 /api/questions 不支持 keyword 参数）
    try {
      const { items } = await fetchQuestions({ sort: 'latest', limit: 5 })
      const words = Array.from(
        new Set(
          trimmed
            .toLowerCase()
            .split(/\s+/)
            .filter((w) => w.length >= 2)
        )
      )
      const matched = []
      const seen = new Set()
      for (const q of items || []) {
        if (matched.length >= 3) break
        if (!q || !q.id || seen.has(q.id)) continue
        const qTitle = (q.title || '').toLowerCase()
        if (words.some((w) => qTitle.includes(w))) {
          seen.add(q.id)
          matched.push(q)
        }
      }
      setSimilarQuestions(matched)
    } catch (err) {
      setSimilarQuestions([])
    }
  }

  const applyPolishSuggestion = () => {
    setTitle(polishSuggestion)
    setShowPolishHint(false)
    setPolishSuggestion('')
  }

  const dismissPolishHint = () => {
    setShowPolishHint(false)
    setPolishSuggestion('')
  }

  const offlineLabel = aiAvailable ? '' : '（离线演示）'

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <FileQuestion className="h-12 w-12 text-aif-muted-foreground" />
        <h2 className="text-xl font-bold text-aif-foreground">需要登录后才能提问</h2>
        <p className="text-sm text-aif-muted-foreground">登录后即可发布问题、回答和参与社区互动。</p>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 rounded-lg bg-aif-primary px-5 py-2.5 text-sm font-semibold text-aif-primary-foreground hover:bg-aif-primary-600 transition-colors"
          >
            登录
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center gap-1.5 rounded-lg border border-aif-border bg-aif-card px-5 py-2.5 text-sm font-semibold text-aif-foreground hover:bg-aif-muted transition-colors"
          >
            注册
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="border-b border-aif-border bg-aif-card -mx-4 -mt-6 px-4 py-8 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 mb-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold tracking-tight text-aif-foreground">发布提问</h1>
          <p className="mt-2 text-aif-muted-foreground">
            描述你的问题，AI 将协助你优化表达并寻找相似解答。
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr,320px]">
        <section className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="question-title" className="block text-sm font-semibold text-aif-foreground">
              问题标题
            </label>
            <input
              id="question-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              placeholder="一句话概括你的问题，例如：如何学习 React？"
              className="w-full rounded-lg border border-aif-input bg-aif-card px-4 py-3 text-base text-aif-foreground placeholder:text-aif-muted-foreground focus:border-aif-primary focus:outline-none focus:ring-2 focus:ring-aif-primary/20"
            />
            {showVaguenessHint && vaguenessResult?.isVague && (
              <div className="bg-[rgba(224,130,46,0.10)] border border-[#e0822e] border-l-4 rounded-lg px-3 py-2 mt-2 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-[#e0822e] mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-[#7b491a]">
                    💡 检测到问题描述较模糊，是否 AI 润色为更精确表述？
                  </p>
                  {vaguenessResult.reason && (
                    <p className="text-xs text-[#7b491a]/80 whitespace-pre-line">
                      {vaguenessResult.reason}
                    </p>
                  )}
                  {vaguenessResult.suggestion && (
                    <p className="text-xs text-aif-muted-foreground">{vaguenessResult.suggestion}</p>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <AiGate fallbackTooltip="AI 暂不可用，无法润色" loading={aiLoading === 'polish-title'}>
                      <button
                        type="button"
                        onClick={handlePolishTitleFromHint}
                        disabled={aiLoading === 'polish-title'}
                        className="inline-flex items-center gap-1.5 rounded-md bg-aif-primary px-3 py-1.5 text-xs font-semibold text-aif-primary-foreground hover:bg-aif-primary-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        {aiLoading === 'polish-title' ? '处理中…' : 'AI 润色'}
                      </button>
                    </AiGate>
                    <button
                      type="button"
                      onClick={() => setShowVaguenessHint(false)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-aif-border bg-aif-card px-3 py-1.5 text-xs font-medium text-aif-foreground hover:bg-aif-muted transition-colors"
                    >
                      忽略
                    </button>
                  </div>
                </div>
              </div>
            )}
            {showPolishHint && polishSuggestion && (
              <div className="flex items-start gap-3 rounded-lg border border-aif-primary-200 bg-aif-primary-50 p-3">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-aif-primary" />
                <div className="flex-1 space-y-1.5">
                  <p className="text-sm text-aif-primary-700">
                    检测到表述可能更清晰，是否采用 AI 建议？
                  </p>
                  <p className="text-sm text-aif-foreground">
                    {polishMock ? '（模拟回复·离线演示）' : ''}
                    {polishSuggestion}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <AiGate fallbackTooltip="AI 暂不可用，无法采用建议">
                      <button
                        type="button"
                        onClick={applyPolishSuggestion}
                        className="inline-flex items-center gap-1.5 rounded-md bg-aif-primary px-3 py-1.5 text-xs font-semibold text-aif-primary-foreground hover:bg-aif-primary-600 transition-colors"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        采用
                      </button>
                    </AiGate>
                    <button
                      type="button"
                      onClick={dismissPolishHint}
                      className="inline-flex items-center gap-1.5 rounded-md border border-aif-border bg-aif-card px-3 py-1.5 text-xs font-medium text-aif-foreground hover:bg-aif-muted transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                      忽略
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label htmlFor="question-body" className="block text-sm font-semibold text-aif-foreground">
                问题详情
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <AiGate fallbackTooltip="AI 暂不可用" loading={aiLoading === 'polish'}>
                  <button
                    type="button"
                    onClick={handlePolishBody}
                    disabled={aiLoading === 'polish' || !body.trim()}
                    className="inline-flex items-center gap-1.5 rounded-md border border-aif-border bg-aif-card px-3 py-1.5 text-xs font-medium text-aif-foreground hover:bg-aif-muted transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-aif-primary" />
                    {aiLoading === 'polish' ? '处理中…' : `AI 润色${offlineLabel}`}
                  </button>
                </AiGate>
                <AiGate fallbackTooltip="AI 暂不可用" loading={aiLoading === 'expand'}>
                  <button
                    type="button"
                    onClick={handleExpand}
                    disabled={aiLoading === 'expand'}
                    className="inline-flex items-center gap-1.5 rounded-md border border-aif-border bg-aif-card px-3 py-1.5 text-xs font-medium text-aif-foreground hover:bg-aif-muted transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Text className="h-3.5 w-3.5 text-aif-primary" />
                    {aiLoading === 'expand' ? '处理中…' : `AI 扩写${offlineLabel}`}
                  </button>
                </AiGate>
                <AiGate fallbackTooltip="AI 暂不可用" loading={aiLoading === 'draft'}>
                  <button
                    type="button"
                    onClick={handleDraft}
                    disabled={aiLoading === 'draft'}
                    className="inline-flex items-center gap-1.5 rounded-md border border-aif-border bg-aif-card px-3 py-1.5 text-xs font-medium text-aif-foreground hover:bg-aif-muted transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <FilePlus className="h-3.5 w-3.5 text-aif-primary" />
                    {aiLoading === 'draft' ? '生成中…' : `生成草稿${offlineLabel}`}
                  </button>
                </AiGate>
              </div>
            </div>
            <textarea
              id="question-body"
              rows={10}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="详细描述你遇到的问题、已尝试的方案和相关环境信息…"
              className="w-full resize-y rounded-lg border border-aif-input bg-aif-card px-4 py-3 text-base leading-relaxed text-aif-foreground placeholder:text-aif-muted-foreground focus:border-aif-primary focus:outline-none focus:ring-2 focus:ring-aif-primary/20"
            />
            {aiAvailable === false && (
              <p className="text-xs text-aif-muted-foreground">
                AI 服务未配置，将返回模拟回复供演示。
              </p>
            )}
            {aiError && (
              <p className="text-xs text-aif-error">AI 调用失败：{aiError}</p>
            )}
            {aiNotice && (
              <p className="text-xs text-aif-muted-foreground">{aiNotice}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="question-tags" className="block text-sm font-semibold text-aif-foreground">
              添加标签
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-aif-muted-foreground" />
              <input
                id="question-tags"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKey}
                placeholder="输入标签后按回车，最多 5 个"
                className="w-full rounded-lg border border-aif-input bg-aif-card py-3 pl-9 pr-4 text-base text-aif-foreground placeholder:text-aif-muted-foreground focus:border-aif-primary focus:outline-none focus:ring-2 focus:ring-aif-primary/20"
              />
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full bg-aif-primary-50 px-2.5 py-1 text-xs font-medium text-aif-primary-700"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      className="hover:text-aif-primary-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 text-sm text-aif-muted-foreground">
              <span>推荐标签：</span>
              {recommendTags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => addRecTag(t)}
                  disabled={tags.includes(t) || tags.length >= 5}
                  className="rounded-full border border-aif-border bg-aif-card px-2.5 py-1 text-xs text-aif-foreground hover:border-aif-primary hover:text-aif-primary transition-colors disabled:opacity-50"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-aif-border pt-6 sm:flex-row sm:items-center sm:justify-end">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-aif-border bg-aif-card px-5 py-2.5 text-sm font-semibold text-aif-foreground hover:bg-aif-muted transition-colors"
            >
              取消
            </Link>
            <button
              type="button"
              onClick={handlePublish}
              disabled={!title.trim() || !body.trim() || publishing}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-aif-primary px-5 py-2.5 text-sm font-semibold text-aif-primary-foreground hover:bg-aif-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
              {publishing ? '发布中…' : '发布问题'}
            </button>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-aif-border bg-aif-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <FileQuestion className="h-5 w-5 text-aif-primary" />
              <h2 className="text-base font-semibold text-aif-foreground">已有相似问题</h2>
            </div>
            <div className="space-y-3">
              {similarQuestions.length === 0 ? (
                <p className="text-sm text-aif-muted-foreground">暂无相似问题</p>
              ) : (
                similarQuestions.map((q) => (
                  <Link
                    key={q.id}
                    to={`/detail/${q.id}`}
                    className="group block rounded-lg border border-aif-border bg-aif-muted/50 p-3 hover:border-aif-primary-300 hover:bg-aif-primary-50 transition-colors"
                  >
                    <h3 className="text-sm font-medium text-aif-foreground group-hover:text-aif-primary-700 transition-colors">
                      {q.title}
                    </h3>
                    <p className="mt-1 text-xs text-aif-muted-foreground">
                      {q.answerCount ?? 0} 个回答 · {q.viewCount ?? 0} 浏览
                    </p>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-aif-border bg-aif-card p-5 shadow-sm">
            <h2 className="mb-3 text-base font-semibold text-aif-foreground">提问小贴士</h2>
            <ul className="space-y-2 text-sm text-aif-muted-foreground">
              {tips.map((t, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-aif-primary" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </>
  )
}
