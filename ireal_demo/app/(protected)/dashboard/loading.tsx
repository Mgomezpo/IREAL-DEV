export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--ink)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-sm text-black/60">
        <div className="h-4 w-4 border-2 border-black/20 border-t-[var(--accent-600)] rounded-full animate-spin" />
        <span>Cargando dashboard…</span>
      </div>
    </div>
  )
}
