import { Link, useNavigate } from 'react-router-dom'
import { useRef, useEffect, useMemo, useState, useCallback } from 'react'
import {
  ArrowLeft,
  Bot,
  FileText,
  PenTool,
  Search,
  User,
  Fingerprint,
  Calendar,
  MessageSquare,
  Edit3,
  RefreshCw,
  Trash2,
  ThumbsUp,
} from 'lucide-react'
import * as aiInteractionService from '../../services/aiInteractionService.js'
import IdentityService from '../../services/identityService.js'
import * as behaviorService from '../../services/behaviorService.js'
import StorageService from '../../services/storageService.js'
import { STORAGE_KEYS } from '../../constants/forumStorageKeys.js'
import { useForumApp } from '../../contexts/ForumAppContext.jsx'

const iconMap = { bot: Bot, 'file-text': FileText, 'pen-tool': PenTool, search: Search }

const FEATURE_ORDER = ['polish', 'expand', 'draft', 'answer', 'summary', 'search']
const FEATURE_LABELS = {
  polish: 'AI 润色',
  expand: 'AI 扩写',
  draft: '生成草稿',
  answer: 'AI 帮我答',
  summary: 'AI 摘要',
  search: '语义搜索',
}
const FEATURE_COLORS = [
  'from-aif-primary-400 to-aif-primary',
  'from-aif-success-400 to-aif-success',
  'from-aif-warning-400 to-aif-warning',
  'from-[#8b5cf6] to-[#7c3aed]',
  'from-[#ec4899] to-[#db2777]',
  'from-[#06b6d4] to-[#0891b2]',
]

function formatDate(ts) {
  if (!ts) return ''
  try {
    const d = new Date(ts)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  } catch (_) {
    return ''
  }
}

function shortId(id) {
  if (!id) return ''
  if (id.length <= 12) return id
  return `${id.slice(0, 6)}…${id.slice(-4)}`
}

function MetricCard({ m }) {
  const Icon = iconMap[m.icon] || Bot
  return (
    <article className="rounded-lg border border-aif-border bg-aif-card p-5 shadow-sm transition hover:shadow-md">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-aif-info-bg text-aif-primary">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-aif-muted-foreground">{m.label}</p>
      <p className="mt-1 text-3xl font-bold text-aif-foreground">{m.value}</p>
    </article>
  )
}

function FeatureChart({ data }) {
  const maxValue = Math.max(1, ...data.map((d) => d.count))
  const items = data.map((d, i) => ({
    ...d,
    color: FEATURE_COLORS[i % FEATURE_COLORS.length],
    pct: Math.max(8, Math.round((d.count / maxValue) * 100)),
  }))
  return (
    <div className="flex h-full flex-col justify-end gap-3 pt-2">
      {items.map((d, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="w-20 shrink-0 text-xs font-medium text-aif-muted-foreground">
            {d.feature}
          </div>
          <div className="relative flex-1 h-7 rounded bg-aif-muted overflow-hidden">
            <div
              className={`h-full rounded bg-gradient-to-r ${d.color} transition-all duration-700 ease-out`}
              style={{ width: `${d.pct}%` }}
            />
          </div>
          <div className="w-8 text-right text-xs font-semibold text-aif-foreground">
            {d.count}
          </div>
        </div>
      ))}
    </div>
  )
}

function SimpleToast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => onClose && onClose(), 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  const bgCls =
    type === 'success'
      ? 'bg-aif-success'
      : type === 'warning'
        ? 'bg-aif-warning'
        : type === 'error'
          ? 'bg-aif-error'
          : 'bg-aif-primary'

  return (
    <div
      className={`fixed top-4 right-4 z-50 ${bgCls} text-white px-4 py-2 rounded-lg shadow-lg animate-fadeInOut`}
    >
      {message}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const chartRef = useRef(null)
  const { identity: ctxIdentity, refreshIdentity } = useForumApp()

  const [toast, setToast] = useState(null)
  const [clearAllDisabled, setClearAllDisabled] = useState(false)
  const [identityRev, setIdentityRev] = useState(0)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() })
  }, [])

  const forceRefreshStats = useCallback(() => {
    setIdentityRev((r) => r + 1)
  }, [])

  useEffect(() => {
    aiInteractionService.markSessionEligible('dashboard')
  }, [])

  const { metrics, featureDistribution, feedbackStats, identity, postsCount, answersCount, viewCount, likeCount, searchCount } = useMemo(() => {
    void identityRev
    const stats = aiInteractionService.getStats()
    const usage = aiInteractionService.getUsageRate()
    const fb = aiInteractionService.getFeedbackStats()

    const m = [
      { label: 'AI 使用次数', value: stats.total.total, icon: 'bot' },
      { label: '真实 AI 次数', value: stats.total.real, icon: 'bot' },
      { label: '模拟次数', value: stats.total.mock, icon: 'bot' },
      {
        label: 'AI 使用率',
        value: usage.usageRate === null ? '--' : `${Math.round(usage.usageRate * 100)}%`,
        icon: 'search',
      },
    ]

    const fd = FEATURE_ORDER.map((key) => ({
      feature: FEATURE_LABELS[key] || key,
      count: (stats.byType && stats.byType[key] && stats.byType[key].total) || 0,
    }))

    const identity = ctxIdentity || IdentityService.getOrCreate()

    let questions = []
    let answers = []
    try {
      questions = StorageService.get(STORAGE_KEYS.QUESTIONS) || []
    } catch (_) {
      questions = []
    }
    try {
      answers = StorageService.get(STORAGE_KEYS.ANSWERS) || []
    } catch (_) {
      answers = []
    }

    const postsCount = Array.isArray(questions)
      ? questions.filter((q) => q && q.authorId === identity.id).length
      : 0
    const answersCount = Array.isArray(answers)
      ? answers.filter((a) => a && a.authorId === identity.id).length
      : 0

    const behavior = behaviorService.getBehavior()
    const viewCount = (behavior.viewedQuestionIds || []).length || 0
    const likeCount =
      ((behavior.likedQuestionIds && behavior.likedQuestionIds.length) || 0) +
      ((behavior.likedAnswerIds || behavior.upvotedAnswerIds || []).length || 0)
    const searchCount =
      ((behavior.searchQueries || behavior.searchHistory || []).length) || 0

    return {
      metrics: m,
      featureDistribution: fd,
      feedbackStats: fb,
      identity,
      postsCount,
      answersCount,
      viewCount,
      likeCount,
      searchCount,
    }
  }, [ctxIdentity, identityRev])

  const handleResetIdentityKeep = () => {
    if (!window.confirm('确定重置昵称与头像吗？你的历史发帖与回答会保留在原 id 下。')) return
    IdentityService.resetIdentityKeepData()
    refreshIdentity()
    forceRefreshStats()
    showToast('昵称与头像已重置')
  }

  const handleGenerateNew = () => {
    if (!window.confirm('生成全新身份后，新的发帖与回答将不再与你当前身份关联，历史数据不会删除。确定？')) return
    if (!window.confirm('再确认一次：身份切换后丢失当前身份下的「我发的内容」计数关联，真的要切换？（不可撤销）')) return
    const fresh = IdentityService.generateNewIdentity({ clearBehavior: false })
    refreshIdentity()
    forceRefreshStats()
    showToast(`已切换到新身份：${fresh.nickname}`)
  }

  const handleClearViewHistory = () => {
    if (!window.confirm('清空浏览历史、点赞、搜索记录、标签权重？该操作不删除你的发帖与回答。')) return
    StorageService.remove(STORAGE_KEYS.BEHAVIOR)
    behaviorService.reset()
    forceRefreshStats()
    showToast('浏览历史已清空')
  }

  const handleClearAll = async () => {
    if (!window.confirm('⚠️ 将删除所有本地数据：发帖、回答、身份、AI 缓存、行为偏好，且无法恢复。确定？')) return
    if (!window.confirm('⚠️ 此操作不可撤销，真的确定要清空全部本地数据？')) return
    setClearAllDisabled(true)
    Object.values(STORAGE_KEYS).forEach((k) => StorageService.remove(k))
    showToast('已清空全部本地数据，正在刷新…')
    setTimeout(() => {
      window.location.href = '/'
    }, 600)
  }

  const helpfulPct = feedbackStats.helpfulRate === null ? 0 : Math.round(feedbackStats.helpfulRate * 100)
  const helpfulColorCls =
    helpfulPct >= 85
      ? 'bg-aif-success'
      : helpfulPct >= 60
        ? 'bg-aif-warning'
        : 'bg-aif-error'
  const helpfulTextCls =
    helpfulPct >= 85
      ? 'text-aif-success'
      : helpfulPct >= 60
        ? 'text-aif-warning'
        : 'text-aif-error'

  return (
    <>
      {toast && (
        <SimpleToast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="mx-auto w-full">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-aif-foreground">数据看板</h1>
            <p className="text-sm text-aif-muted-foreground">本地匿名使用数据概览</p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-aif-muted-foreground hover:text-aif-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Link>
        </div>
      </div>

      <section
        className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="核心指标"
      >
        {metrics.map((m, i) => (
          <MetricCard key={i} m={m} />
        ))}
      </section>

      <section
        className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2"
        aria-label="数据图表与反馈"
      >
        <article className="rounded-lg border border-aif-border bg-aif-card p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-aif-foreground">
            AI 功能使用分布
          </h2>
          <div ref={chartRef} className="relative h-64 w-full">
            <FeatureChart data={featureDistribution} />
          </div>
        </article>

        <article className="rounded-lg border border-aif-border bg-aif-card p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-aif-foreground">用户反馈</h2>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${helpfulTextCls}`}>
              {feedbackStats.helpfulRate === null ? '--' : `${helpfulPct}%`}
            </span>
            <span className="text-sm text-aif-muted-foreground">AI 摘要有帮助率</span>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-aif-muted-foreground">
              <span>0%</span>
              <span>100%</span>
            </div>
            <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-aif-muted">
              <div
                className={`h-full rounded-full ${helpfulColorCls} transition-all duration-700`}
                style={{ width: `${helpfulPct}%` }}
              />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-md bg-aif-muted/50 px-3 py-2">
              <p className="text-aif-muted-foreground">反馈总数</p>
              <p className="mt-0.5 text-lg font-semibold text-aif-foreground">{feedbackStats.total}</p>
            </div>
            <div className="rounded-md bg-aif-success-bg px-3 py-2">
              <p className="text-aif-success">好评</p>
              <p className="mt-0.5 text-lg font-semibold text-aif-success">{feedbackStats.helpful}</p>
            </div>
            <div className="rounded-md bg-aif-warning-bg px-3 py-2">
              <p className="text-aif-warning">需要更新</p>
              <p className="mt-0.5 text-lg font-semibold text-aif-warning">{feedbackStats.needsUpdate}</p>
            </div>
            <div className="rounded-md bg-aif-error-bg px-3 py-2">
              <p className="text-aif-error">不准确</p>
              <p className="mt-0.5 text-lg font-semibold text-aif-error">{feedbackStats.inaccurate}</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-aif-muted-foreground">
            基于 {feedbackStats.total} 次摘要生成后的本地反馈统计。
          </p>
        </article>
      </section>

      <section
        className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2"
        aria-label="匿名身份与数据操作"
      >
        <article className="rounded-lg border border-aif-border bg-aif-card p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-aif-foreground">当前匿名身份</h2>
          <div className="flex items-start gap-4 sm:items-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-aif-primary-300 to-aif-success text-white shadow-sm">
              <User className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold text-aif-foreground">{identity.nickname || identity.name || '匿名用户'}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-aif-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Fingerprint className="h-3.5 w-3.5" />
                  <code className="rounded bg-aif-muted px-1.5 py-0.5 font-aif-mono text-xs text-aif-foreground">
                    {shortId(identity.id)}
                  </code>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  创建于 {formatDate(identity.createdAt)}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-md bg-aif-info-bg px-2 py-1 text-aif-primary">
                  <MessageSquare className="h-3 w-3" /> {postsCount} 篇提问
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-aif-success-bg px-2 py-1 text-aif-success">
                  <Edit3 className="h-3 w-3" /> {answersCount} 篇回答
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-aif-muted px-2 py-1 text-aif-muted-foreground">
                  <Search className="h-3 w-3" /> {searchCount} 次搜索
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-aif-muted px-2 py-1 text-aif-muted-foreground">
                  <ThumbsUp className="h-3 w-3" /> {likeCount} 次点赞
                </span>
              </div>
              <p className="mt-2 text-xs text-aif-muted-foreground">
                浏览问题：{viewCount} 个
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-aif-border pt-4">
            <button
              onClick={handleResetIdentityKeep}
              className="inline-flex items-center gap-1.5 rounded-md border border-aif-border bg-aif-card px-3 py-2 text-xs font-medium text-aif-foreground hover:bg-aif-muted transition-colors min-w-[44px] min-h-[44px]"
            >
              <RefreshCw className="h-3.5 w-3.5 text-aif-primary" />
              重置身份（保留数据）
            </button>
            <button
              onClick={handleGenerateNew}
              className="inline-flex items-center gap-1.5 rounded-md border border-aif-border bg-aif-card px-3 py-2 text-xs font-medium text-aif-foreground hover:bg-aif-muted transition-colors min-w-[44px] min-h-[44px]"
            >
              <RefreshCw className="h-3.5 w-3.5 text-aif-warning" />
              生成全新身份
            </button>
          </div>
        </article>

        <article className="rounded-lg border border-aif-error-bg bg-aif-card p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-aif-foreground">数据管理</h2>
          <p className="mb-4 text-sm text-aif-muted-foreground">
            所有数据仅保存在当前浏览器的 localStorage，清空后不可恢复。
          </p>
          <div className="space-y-2">
            <button
              onClick={handleClearViewHistory}
              className="group w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-aif-border bg-aif-card px-4 py-2.5 text-sm font-medium text-aif-foreground hover:bg-aif-muted transition-all hover:ring-2 hover:ring-aif-error hover:ring-offset-1 min-h-[44px]"
            >
              <Trash2 className="h-4 w-4 text-aif-muted-foreground group-hover:text-aif-error transition-colors" />
              清空浏览历史
            </button>
            <button
              onClick={handleClearAll}
              disabled={clearAllDisabled}
              className="group w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-aif-error bg-aif-error-bg px-4 py-2.5 text-sm font-semibold text-aif-error hover:brightness-95 transition-all hover:ring-2 hover:ring-aif-error hover:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:ring-0 min-h-[44px]"
            >
              <Trash2 className="h-4 w-4" />
              {clearAllDisabled ? '正在清空…' : '清空全部本地数据'}
            </button>
          </div>
        </article>
      </section>
    </>
  )
}
