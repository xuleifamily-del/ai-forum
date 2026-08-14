export default function QuestionSkeleton() {
  return (
    <div className="rounded-xl border border-aif-border bg-aif-card p-5 shadow-sm animate-pulse">
      <div className="flex gap-4">
        <div className="h-24 w-32 bg-aif-muted rounded-lg" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-5 w-2/3 bg-aif-muted rounded" />
          <div className="h-4 w-full bg-aif-muted/60 rounded" />
          <div className="h-4 w-5/6 bg-aif-muted/60 rounded" />
          <div className="mt-2 flex gap-2">
            <div className="h-5 w-12 bg-aif-muted rounded-full" />
            <div className="h-5 w-16 bg-aif-muted rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
