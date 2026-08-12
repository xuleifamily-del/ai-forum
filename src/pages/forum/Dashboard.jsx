import { Link, useNavigate } from 'react-router-dom'
import { useRef, useEffect } from 'react'
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
} from 'lucide-react'
import { dashboardData } from './mockData.js'

const iconMap = { bot: Bot, 'file-text': FileText, 'pen-tool': PenTool, search: Search }

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
  const max = Math.max(...data.map((d) => d.count))
  const items = data.map((d) => ({
    ...d,
    pct: Math.max(8, Math.round((d.count / max) * 100)),
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
              className="h-full rounded bg-gradient-to-r from-aif-primary-400 to-aif-primary transition-all duration-700 ease-out"
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

export default function Dashboard() {
  const navigate = useNavigate()
  const chartRef = useRef(null)

  useEffect(() => {
  }, [])

  const identity = dashboardData.identity

  return (
    <>
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
        className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="核心指标"
      >
        {dashboardData.metrics.map((m, i) => (
          <MetricCard key={i} m={m} />
        ))}
      </section>

      <section
        className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3"
        aria-label="数据图表与反馈"
      >
        <article className="rounded-lg border border-aif-border bg-aif-card p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-base font-semibold text-aif-foreground">
            AI 功能使用分布
          </h2>
          <div ref={chartRef} className="relative h-64 w-full">
            <FeatureChart data={dashboardData.featureDistribution} />
          </div>
        </article>

        <article className="rounded-lg border border-aif-border bg-aif-card p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-aif-foreground">用户反馈</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-aif-foreground">
              {dashboardData.helpfulRate}%
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
                className="h-full rounded-full bg-aif-primary transition-all duration-700"
                style={{ width: `${dashboardData.helpfulRate}%` }}
              />
            </div>
          </div>
          <p className="mt-4 text-xs text-aif-muted-foreground">
            基于 8 次摘要生成后的本地反馈统计。
          </p>
        </article>
      </section>

      <section
        className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3"
        aria-label="匿名身份与数据操作"
      >
        <article className="rounded-lg border border-aif-border bg-aif-card p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-base font-semibold text-aif-foreground">当前匿名身份</h2>
          <div className="flex items-start gap-4 sm:items-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-aif-primary-300 to-aif-success text-white shadow-sm">
              <User className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold text-aif-foreground">{identity.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-aif-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Fingerprint className="h-3.5 w-3.5" />
                  <code className="rounded bg-aif-muted px-1.5 py-0.5 font-aif-mono text-xs text-aif-foreground">
                    {identity.id}
                  </code>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  创建于 {identity.createdAt}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-md bg-aif-info-bg px-2 py-1 text-aif-primary">
                  <MessageSquare className="h-3 w-3" /> {identity.postsCount} 篇提问
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-aif-success-bg px-2 py-1 text-aif-success">
                  <Edit3 className="h-3 w-3" /> {identity.answersCount} 篇回答
                </span>
              </div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-aif-border pt-4">
            <button className="inline-flex items-center gap-1.5 rounded-md border border-aif-border bg-aif-card px-3 py-2 text-xs font-medium text-aif-foreground hover:bg-aif-muted transition-colors">
              <RefreshCw className="h-3.5 w-3.5 text-aif-primary" />
              重置身份（保留数据）
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-aif-border bg-aif-card px-3 py-2 text-xs font-medium text-aif-foreground hover:bg-aif-muted transition-colors">
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
              onClick={() => {
                if (confirm('确认清空本地浏览与搜索历史？AI 使用数据仍将保留。')) {
                  alert('已清空（演示）')
                }
              }}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-aif-border bg-aif-card px-4 py-2.5 text-sm font-medium text-aif-foreground hover:bg-aif-muted transition-colors"
            >
              <Trash2 className="h-4 w-4 text-aif-muted-foreground" />
              清空浏览历史
            </button>
            <button
              onClick={() => {
                if (confirm('确认清空所有本地数据？此操作不可撤销！')) {
                  alert('已全部清空（演示）')
                  navigate('/')
                }
              }}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-aif-error bg-aif-error-bg px-4 py-2.5 text-sm font-semibold text-aif-error hover:brightness-95 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              清空全部本地数据
            </button>
          </div>
        </article>
      </section>
    </>
  )
}
