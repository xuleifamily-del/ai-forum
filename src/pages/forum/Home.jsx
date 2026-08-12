import { Link } from 'react-router-dom'
import { Edit3, Compass, Eye, MessageCircle, Clock, Sparkles, PenTool, Search } from 'lucide-react'
import { recommendedQuestions, aiFeatures } from './mockData.js'

function TagBadge({ text, color }) {
  const colors = {
    primary: 'bg-aif-primary-50 text-aif-primary-700',
    success: 'bg-aif-success-bg text-aif-success',
    muted: 'bg-aif-muted text-aif-muted-foreground',
  }
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[color] || colors.muted}`}>
      {text}
    </span>
  )
}

function QuestionCard({ q }) {
  return (
    <Link
      to={`/detail/${q.id}`}
      className="card-hover group rounded-xl border border-aif-border bg-aif-card p-5"
    >
      <h3 className="text-lg font-semibold text-aif-foreground group-hover:text-aif-primary transition-colors">
        {q.title}
      </h3>
      <p className="mt-2 line-clamp-2 text-sm text-aif-muted-foreground">{q.excerpt}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {q.tags.map((t, i) => (
          <TagBadge key={i} text={t.text} color={t.color} />
        ))}
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs text-aif-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" /> {q.views >= 1000 ? `${(q.views / 1000).toFixed(1)}k` : q.views} 浏览
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageCircle className="h-3.5 w-3.5" /> {q.answers} 回答
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" /> {q.createdAt}
        </span>
      </div>
    </Link>
  )
}

function FeatureCard({ f }) {
  const iconMap = { sparkles: Sparkles, 'pen-tool': PenTool, search: Search }
  const Icon = iconMap[f.icon] || Sparkles
  const colorMap = {
    primary: 'bg-aif-primary-50 text-aif-primary',
    success: 'bg-aif-success-bg text-aif-success',
  }
  return (
    <div className="rounded-xl border border-aif-border bg-aif-card p-5">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorMap[f.color] || colorMap.primary}`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-semibold text-aif-foreground">{f.title}</h3>
      <p className="mt-1 text-sm text-aif-muted-foreground">{f.desc}</p>
    </div>
  )
}

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden rounded-2xl border border-aif-border bg-aif-card p-8 sm:p-12" data-dom-id="hero-section">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-aif-primary-200/30 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative z-10 max-w-2xl">
          <h1 className="font-aif-sans text-3xl font-bold tracking-tight text-aif-foreground sm:text-4xl">
            问得出口，答得回来
          </h1>
          <p className="mt-4 text-base leading-relaxed text-aif-muted-foreground sm:text-lg">
            一个匿名的 AI 辅助问答社区。提出问题，获得社区与智能助手的协同回答，让每一次讨论都更有价值。
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/ask"
              className="inline-flex items-center gap-2 rounded-lg bg-aif-primary px-5 py-3 text-sm font-semibold text-aif-primary-foreground shadow-sm hover:bg-aif-primary-600 transition-colors"
            >
              <Edit3 className="h-4 w-4" />
              去提问
            </Link>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 rounded-lg border border-aif-border bg-aif-background px-5 py-3 text-sm font-semibold text-aif-foreground hover:bg-aif-muted transition-colors"
            >
              <Compass className="h-4 w-4" />
              浏览问题
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="recommend-title">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="recommend-title" className="text-xl font-bold text-aif-foreground">
            为你推荐
          </h2>
          <Link to="/explore" className="text-sm font-medium text-aif-primary hover:text-aif-primary-700">
            查看更多
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {recommendedQuestions.map((q) => (
            <QuestionCard key={q.id} q={q} />
          ))}
        </div>
      </section>

      <section className="mt-12" aria-labelledby="features-title">
        <h2 id="features-title" className="mb-4 text-xl font-bold text-aif-foreground">
          AI 辅助亮点
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {aiFeatures.map((f, i) => (
            <FeatureCard key={i} f={f} />
          ))}
        </div>
      </section>
    </>
  )
}
