import { cloneElement, isValidElement, Children } from 'react'
import { useForumApp } from '../../contexts/ForumAppContext.jsx'
import { AlertTriangle } from 'lucide-react'

export default function AiGate({ children, fallbackTooltip = 'AI 暂不可用', loading = false }) {
  const { aiState } = useForumApp()

  const isUnavailable = aiState === 'unavailable'
  const isDegraded = aiState === 'degraded'
  const disabled = isUnavailable || loading

  const childArray = Children.toArray(children)
  const hasSingleChild = childArray.length === 1
  const singleChild = hasSingleChild ? childArray[0] : null
  const isSingleButton = isValidElement(singleChild) && singleChild.type === 'button'

  if (isSingleButton) {
    const originalProps = singleChild.props
    const mergedTitle = isUnavailable
      ? [originalProps.title, fallbackTooltip].filter(Boolean).join(' | ')
      : originalProps.title
    const mergedDisabled = originalProps.disabled || disabled

    return (
      <span className="inline-flex items-center gap-1">
        {cloneElement(singleChild, {
          disabled: mergedDisabled,
          title: mergedTitle,
          className: [
            originalProps.className,
            isUnavailable ? 'opacity-50 cursor-not-allowed' : '',
          ].filter(Boolean).join(' ').trim() || undefined,
        })}
        {isDegraded && !isUnavailable && (
          <span title="AI 不稳定，可能降级处理" className="inline-flex items-center">
            <AlertTriangle className="h-3.5 w-3.5 text-aif-amber-600" />
          </span>
        )}
      </span>
    )
  }

  return (
    <span
      className={[
        'inline-flex items-center gap-1',
        isUnavailable ? 'opacity-50 pointer-events-none' : '',
      ].filter(Boolean).join(' ').trim() || undefined}
      title={isUnavailable ? fallbackTooltip : undefined}
    >
      {children}
      {isDegraded && !isUnavailable && (
        <span title="AI 不稳定，可能降级处理" className="inline-flex items-center">
          <AlertTriangle className="h-3.5 w-3.5 text-aif-amber-600" />
        </span>
      )}
    </span>
  )
}
