import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createQuestion } from '../../services/questionRepository.js'
import { useForumApp } from '../../contexts/ForumAppContext.jsx'
import {
  Sparkles,
  Wand2,
  Text,
  FilePlus,
  Hash,
  Send,
  FileQuestion,
  CheckCircle2,
} from 'lucide-react'

const recommendTags = ['React', 'TypeScript', 'Tailwind CSS', 'Node.js']

const similarQuestions = [
  {
    title: '如何高效地学习 React Hooks 的使用？',
    answers: 3,
    likes: 12,
  },
  {
    title: 'TypeScript 泛型在实际项目中的最佳实践有哪些？',
    answers: 5,
    likes: 28,
  },
  {
    title: 'Tailwind CSS 与 CSS Modules 应该如何选择？',
    answers: 8,
    likes: 45,
  },
]

const tips = [
  '标题尽量简洁明确，避免模糊词汇。',
  '正文补充环境、报错信息和已尝试方案。',
  '添加标签有助于他人快速发现你的问题。',
]

export default function Ask() {
  const navigate = useNavigate()
  const { identity } = useForumApp()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [showPolishHint, setShowPolishHint] = useState(false)
  const [aiLoading, setAiLoading] = useState(null)
  const [publishing, setPublishing] = useState(false)

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
    if (!title.trim() || !body.trim() || !identity) return
    setPublishing(true)
    try {
      const question = await createQuestion({
        title: title.trim(),
        body: body.trim(),
        tags,
        authorId: identity.id,
        authorName: identity.nickname,
        authorAvatarSeed: identity.avatarSeed,
        aiAssisted: false,
      })
      navigate(`/detail/${question.id}`)
    } catch (err) {
      alert('发布失败：' + err.message)
    } finally {
      setPublishing(false)
    }
  }

  const mockAiAction = (type, target) => {
    setAiLoading(type)
    setTimeout(() => {
      if (target === 'title') {
        setTitle((prev) => (prev ? `${prev}（附复现步骤与环境信息）` : '如何优雅地处理 React 中 useEffect 依赖不稳定导致的重复执行？'))
      } else if (type === 'polish') {
        setBody((prev) => (prev ? `【润色后】\n${prev}\n\n补充说明：以上问题在 React 18 开发环境中尤为明显。` : '【AI 润色示例】问题描述经 AI 优化后表达更清晰，便于回答者理解。'))
      } else if (type === 'expand') {
        setBody((prev) => (prev ? `${prev}\n\n【扩写】\n已尝试的方案：\n1. 使用 JSON.stringify 打印依赖值，显示并未变化\n2. 尝试将依赖去除（非理想）后不再重复执行\n期望：能够在保持依赖完整的前提下，定位引用变化的根因。` : '【AI 扩写示例】\n详细描述问题：\n- 运行环境：React 18 + Vite，开启 StrictMode\n- 期望行为：useEffect 仅在 filter 实际变化时执行一次\n- 实际行为：每次渲染都会重新触发 effect'))
      } else if (type === 'draft') {
        setBody('【AI 生成草稿】\n\n**问题背景**\n最近在项目中使用 React Hooks 开发时遇到一个比较棘手的问题：\n\n**现象描述**\n- 复现步骤：打开页面 → 观察控制台日志 → 发现 effect 被重复调用\n- 影响范围：导致接口重复请求，产生额外开销\n\n**已尝试方案**\n1. 检查依赖数组是否完整（通过 exhaustive-deps 验证）\n2. 打印依赖值，表面看起来没有变化\n3. 怀疑引用变化，但未掌握可靠的定位手段\n\n**期望结果**\n希望获得一套系统排查步骤，快速定位此类问题。')
      }
      setAiLoading(null)
      if (target === 'title') setShowPolishHint(false)
    }, 700)
  }

  const onTitleChange = (v) => {
    setTitle(v)
    if (v.length > 0 && v.length < 12) setShowPolishHint(true)
    else setShowPolishHint(false)
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
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="一句话概括你的问题，例如：如何学习 React？"
              className="w-full rounded-lg border border-aif-input bg-aif-card px-4 py-3 text-base text-aif-foreground placeholder:text-aif-muted-foreground focus:border-aif-primary focus:outline-none focus:ring-2 focus:ring-aif-primary/20"
            />
            {showPolishHint && (
              <div className="flex items-start gap-3 rounded-lg border border-aif-primary-200 bg-aif-primary-50 p-3">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-aif-primary" />
                <p className="flex-1 text-sm text-aif-primary-700">
                  检测到问题描述较模糊，是否生成更精确的表述？
                </p>
                <button
                  type="button"
                  onClick={() => mockAiAction('polish', 'title')}
                  disabled={aiLoading === 'polish'}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-aif-primary px-3 py-1.5 text-xs font-semibold text-aif-primary-foreground hover:bg-aif-primary-600 transition-colors disabled:opacity-60"
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  {aiLoading === 'polish' ? '处理中…' : 'AI 润色'}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label htmlFor="question-body" className="block text-sm font-semibold text-aif-foreground">
                问题详情
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => mockAiAction('polish', 'body')}
                  disabled={aiLoading === 'polish'}
                  className="inline-flex items-center gap-1.5 rounded-md border border-aif-border bg-aif-card px-3 py-1.5 text-xs font-medium text-aif-foreground hover:bg-aif-muted transition-colors disabled:opacity-60"
                >
                  <Sparkles className="h-3.5 w-3.5 text-aif-primary" />
                  {aiLoading === 'polish' ? '处理中…' : 'AI 润色'}
                </button>
                <button
                  type="button"
                  onClick={() => mockAiAction('expand', 'body')}
                  disabled={aiLoading === 'expand'}
                  className="inline-flex items-center gap-1.5 rounded-md border border-aif-border bg-aif-card px-3 py-1.5 text-xs font-medium text-aif-foreground hover:bg-aif-muted transition-colors disabled:opacity-60"
                >
                  <Text className="h-3.5 w-3.5 text-aif-primary" />
                  {aiLoading === 'expand' ? '处理中…' : 'AI 扩写'}
                </button>
                <button
                  type="button"
                  onClick={() => mockAiAction('draft', 'body')}
                  disabled={aiLoading === 'draft'}
                  className="inline-flex items-center gap-1.5 rounded-md border border-aif-border bg-aif-card px-3 py-1.5 text-xs font-medium text-aif-foreground hover:bg-aif-muted transition-colors disabled:opacity-60"
                >
                  <FilePlus className="h-3.5 w-3.5 text-aif-primary" />
                  {aiLoading === 'draft' ? '生成中…' : '生成草稿'}
                </button>
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
              {similarQuestions.map((q, i) => (
                <Link
                  key={i}
                  to="/detail/sim"
                  className="group block rounded-lg border border-aif-border bg-aif-muted/50 p-3 hover:border-aif-primary-300 hover:bg-aif-primary-50 transition-colors"
                >
                  <h3 className="text-sm font-medium text-aif-foreground group-hover:text-aif-primary-700 transition-colors">
                    {q.title}
                  </h3>
                  <p className="mt-1 text-xs text-aif-muted-foreground">
                    {q.answers} 个回答 · {q.likes} 赞
                  </p>
                </Link>
              ))}
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
