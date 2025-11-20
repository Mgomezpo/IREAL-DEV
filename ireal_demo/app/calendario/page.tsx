"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Check, Clock, Grid3X3, Loader2, X } from "lucide-react"
import { useNavigationState } from "@/hooks/useNavigationState"

type ViewType = "month" | "week" | "agenda"
type StatusType = "idea" | "draft" | "scheduled" | "published"

interface ContentPiece {
  id: string
  plan_id: string
  title: string
  channel: "IG" | "YT" | "LI" | "X" | "TT" | "FB"
  status: StatusType
  date: string
  time?: string
  copy?: string
  script?: string
  publish_state?: "idle" | "queued" | "posting" | "success" | "error"
  publish_last_error?: string
}

const channelIcons: Record<ContentPiece["channel"], string> = {
  IG: "IG",
  YT: "YT",
  LI: "IN",
  X: "X",
  TT: "TT",
  FB: "FB",
}

const featureFlags = {
  calendar:
    process.env.NEXT_PUBLIC_CALENDAR_ENABLED === undefined
      ? true
      : process.env.NEXT_PUBLIC_CALENDAR_ENABLED === "true",
  publish:
    process.env.NEXT_PUBLIC_PUBLISH_ENABLED === undefined
      ? false
      : process.env.NEXT_PUBLIC_PUBLISH_ENABLED === "true",
}

const uxCopy = {
  streaming: "Generando calendario... mantenemos la conexión activa con un pulso constante.",
  timeout:
    "El calendario tardó demasiado. Intenta de nuevo y revisa tu conexión. Si persiste, vuelve al modo anterior.",
  retry: "Reintentar generación",
  diffTitle: "Cambios detectados",
  diffSummary:
    "Revisa y aplica solo si estás de acuerdo; puedes cancelar para conservar tu versión actual.",
  diffApply: "Aplicar cambios",
  diffCancel: "Cancelar y mantener versión actual",
  publishOk: "Publicación lista (modo dry-run). Revisa cada pieza antes de ponerla en vivo.",
  publishError:
    "Algunas piezas fallaron. Revisa canal, credenciales o vuelve a intentar más tarde.",
  exportOk: "Exportación lista. Descarga CSV/JSON y valida los datos antes de enviar.",
  exportError:
    "No pudimos exportar. Intenta de nuevo o usa el modo legado para no perder el trabajo.",
  channelMissing:
    "Conecta tu cuenta de TikTok o Instagram para publicar. Sin conexión solo mostramos dry-run.",
  legacyFallback:
    "Modo legado activo: publicación/exportación desactivada por bandera. Puedes seguir editando y exportar en modo manual.",
}

export default function Calendario() {
  const searchParams = useSearchParams()
  const { registerState } = useNavigationState()
  const [isTransitioning] = useState(false)
  const [view, setView] = useState<ViewType>("month")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [pieces, setPieces] = useState<ContentPiece[]>([])
  const [pendingPieces, setPendingPieces] = useState<ContentPiece[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [streaming, setStreaming] = useState(false)
  const [timeout, setTimeoutState] = useState(false)
  const [publishStatus, setPublishStatus] = useState<"ok" | "error" | null>(null)
  const [exportStatus, setExportStatus] = useState<"ok" | "error" | null>(null)
  const [channelMissing, setChannelMissing] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const legacyMode = !featureFlags.publish

  const diffSummary = useMemo(() => {
    if (!pendingPieces) return ""
    const added = pendingPieces.filter((np) => !pieces.find((p) => p.id === np.id)).length
    const removed = pieces.filter((p) => !pendingPieces.find((np) => np.id === p.id)).length
    const changed = pendingPieces.filter((np) =>
      pieces.some((p) => p.id === np.id && (p.title !== np.title || p.date !== np.date || p.channel !== np.channel)),
    ).length
    return `Se detectaron cambios: ${added} nuevas, ${changed} actualizadas, ${removed} eliminadas.`
  }, [pendingPieces, pieces])

  useEffect(() => {
    // seed from query if present
    const fromQueryStreaming = searchParams.get("streaming") === "1"
    const fromQueryTimeout = searchParams.get("timeout") === "1"
    const fromQueryPublish =
      searchParams.get("publish") === "ok"
        ? "ok"
        : searchParams.get("publish") === "error"
        ? "error"
        : null
    const fromQueryExport =
      searchParams.get("export") === "ok"
        ? "ok"
        : searchParams.get("export") === "error"
        ? "error"
        : null
    const fromQueryChannel = searchParams.get("channel") === "missing"
    if (fromQueryStreaming) setStreaming(true)
    if (fromQueryTimeout) setTimeoutState(true)
    if (fromQueryPublish) setPublishStatus(fromQueryPublish)
    if (fromQueryExport) setExportStatus(fromQueryExport)
    if (fromQueryChannel) setChannelMissing(true)
  }, [searchParams])

  useEffect(() => {
    loadPieces()
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    registerState({
      view,
      pendingCount: pendingPieces?.length ?? 0,
      streaming,
      timestamp: Date.now(),
    })
  }, [registerState, view, pendingPieces?.length, streaming])

  const loadPieces = async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setStreaming(true)
    setTimeoutState(false)
    const timeoutId = setTimeout(() => {
      controller.abort()
      setTimeoutState(true)
      setStreaming(false)
      setLoading(false)
    }, 15000)
    try {
      const month = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`
      const res = await fetch(`/api/pieces?month=${month}`, { signal: controller.signal })
      if (!res.ok) throw new Error("network")
      const data = await res.json()
      const nextPieces: ContentPiece[] = data.pieces || []
      // compute diff
      const hasDiff =
        nextPieces.length !== pieces.length ||
        nextPieces.some((np) => {
          const prev = pieces.find((p) => p.id === np.id)
          if (!prev) return true
          return (
            prev.title !== np.title ||
            prev.date !== np.date ||
            prev.channel !== np.channel ||
            prev.status !== np.status ||
            prev.time !== np.time
          )
        })
      if (hasDiff && pieces.length > 0) {
        setPendingPieces(nextPieces)
      } else {
        setPieces(nextPieces)
        setPendingPieces(null)
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setTimeoutState(true)
      }
    } finally {
      clearTimeout(timeoutId)
      setStreaming(false)
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setTimeoutState(false)
    loadPieces()
  }

  const handleApplyDiff = () => {
    if (pendingPieces) {
      setPieces(pendingPieces)
      setPendingPieces(null)
    }
  }

  const handleCancelDiff = () => {
    setPendingPieces(null)
  }

  const handlePublish = async () => {
    if (!featureFlags.publish) {
      setPublishStatus("error")
      setChannelMissing(true)
      return
    }
    try {
      setPublishStatus(null)
      const res = await fetch("/api/ai/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendarId: "cal-1" }),
      })
      if (res.ok) {
        setPublishStatus("ok")
        setChannelMissing(false)
      } else {
        setPublishStatus("error")
        const body = await res.json().catch(() => null)
        setChannelMissing(body?.error?.code === "CHANNEL_AUTH_MISSING")
      }
    } catch {
      setPublishStatus("error")
    }
  }

  const handleExport = async () => {
    try {
      setExportStatus(null)
      const res = await fetch("/api/ai/calendar/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendarId: "cal-1", format: "json" }),
      })
      if (res.ok) {
        setExportStatus("ok")
      } else {
        setExportStatus("error")
      }
    } catch {
      setExportStatus("error")
    }
  }

  const formatDateLabel = (date: Date) =>
    date.toLocaleDateString("es-ES", { month: "long", year: "numeric" })

  return (
    <div className={`min-h-screen bg-[var(--surface)] ${isTransitioning ? "notebook-exit" : "notebook-enter"}`}>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-2 rounded-lg bg-black/5">
            <ArrowLeft className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-black">Calendario</h1>
            <p className="text-black/70 text-sm">Tu cronograma de contenido con estados operativos mínimos</p>
          </div>
        </div>

        {/* Estados operativos */}
        <div className="mb-6 space-y-3">
          {legacyMode && (
            <div className="p-3 border border-black/10 rounded-lg bg-white/40 text-sm text-black/80">
              {uxCopy.legacyFallback}
            </div>
          )}
          {streaming && (
            <div className="p-3 border border-[var(--accent-600)]/20 rounded-lg bg-[var(--accent-600)]/5 text-sm text-[var(--accent-700)] flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{uxCopy.streaming}</span>
            </div>
          )}
          {timeout && (
            <div className="p-3 border border-[var(--accent-600)]/30 rounded-lg bg-[var(--accent-50)] text-sm text-[var(--accent-700)]">
              <div className="font-semibold mb-1">Tiempo de espera</div>
              <p className="mb-2">{uxCopy.timeout}</p>
              <button className="text-[var(--accent-600)] font-semibold text-xs" onClick={handleRetry}>
                {uxCopy.retry}
              </button>
            </div>
          )}
          {pendingPieces && (
            <div className="p-3 border border-black/10 rounded-lg bg-white/60">
              <div className="font-semibold text-sm mb-1">{uxCopy.diffTitle}</div>
              <p className="text-sm text-black/70 mb-2">{diffSummary}</p>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-xs font-semibold rounded-md bg-[var(--accent-600)] text-white" onClick={handleApplyDiff}>
                  {uxCopy.diffApply}
                </button>
                <button className="px-3 py-1.5 text-xs font-semibold rounded-md border border-black/15 text-black/70" onClick={handleCancelDiff}>
                  {uxCopy.diffCancel}
                </button>
              </div>
            </div>
          )}
          {(publishStatus || exportStatus) && (
            <div className="p-3 border border-black/10 rounded-lg bg-white/50 text-sm text-black/80">
              <div className="font-semibold mb-1">Estado de publicación/exportación</div>
              <p className="mb-1">
                {publishStatus === "ok" && uxCopy.publishOk}
                {publishStatus === "error" && uxCopy.publishError}
                {exportStatus === "ok" && uxCopy.exportOk}
                {exportStatus === "error" && uxCopy.exportError}
              </p>
              {channelMissing && <p className="text-xs text-[var(--accent-700)]">{uxCopy.channelMissing}</p>}
            </div>
          )}
          <div className="p-3 border border-dashed border-black/10 rounded-lg bg-white/30 text-xs text-black/70 space-y-1">
            <div className="font-semibold text-black">Copys clave (es):</div>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>{uxCopy.streaming}</li>
              <li>{uxCopy.timeout}</li>
              <li>{uxCopy.diffSummary}</li>
              <li>{uxCopy.publishOk}</li>
              <li>{uxCopy.publishError}</li>
              <li>{uxCopy.exportOk}</li>
              <li>{uxCopy.exportError}</li>
              <li>{uxCopy.channelMissing}</li>
              <li>{uxCopy.legacyFallback}</li>
            </ul>
          </div>
        </div>

        {/* Controles principales */}
        <div className="bg-white/40 border border-[#E5E5E5] rounded-xl p-4 mb-6 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1.5 text-sm font-medium text-black hover:bg-black/5 rounded-lg transition-colors"
              >
                Hoy
              </button>
              <div className="px-3 py-1.5 text-sm font-medium rounded-md bg-white text-black shadow-sm">
                {formatDateLabel(currentDate)}
              </div>
              <div className="flex bg-black/5 rounded-lg p-1">
                <button
                  onClick={() => setView("month")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    view === "month" ? "bg-white text-black shadow-sm" : "text-black/70 hover:text-black"
                  }`}
                >
                  <Grid3X3 className="h-4 w-4 inline mr-1" />
                  Mes
                </button>
                <button
                  onClick={() => setView("week")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    view === "week" ? "bg-white text-black shadow-sm" : "text-black/70 hover:text-black"
                  }`}
                >
                  <Clock className="h-4 w-4 inline mr-1" />
                  Semana
                </button>
                <button
                  onClick={() => setView("agenda")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    view === "agenda" ? "bg-white text-black shadow-sm" : "text-black/70 hover:text-black"
                  }`}
                >
                  Agenda
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handlePublish}
                className="px-3 py-2 text-sm font-semibold rounded-md bg-[var(--accent-600)] text-white hover:opacity-90"
              >
                Publicar (dry-run)
              </button>
              <button
                onClick={handleExport}
                className="px-3 py-2 text-sm font-semibold rounded-md border border-black/10 text-black hover:bg-white"
              >
                Exportar (JSON)
              </button>
              <button
                onClick={loadPieces}
                className="px-3 py-2 text-sm font-semibold rounded-md border border-black/15 text-black hover:bg-white"
              >
                Regenerar / Cargar
              </button>
            </div>
          </div>
        </div>

        {/* Lista simple de piezas */}
        <div className="bg-white/40 border border-[#E5E5E5] rounded-xl p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-black/30" />
            </div>
          ) : (
            <div className="space-y-3">
              {pieces.length === 0 && <p className="text-sm text-black/60">Aún no hay piezas para este mes.</p>}
              {pieces.map((piece) => (
                <div
                  key={piece.id}
                  className="rounded-lg border border-[#E5E5E5] bg-white/70 p-3 flex items-start justify-between"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-black/5 border border-black/10">
                        {channelIcons[piece.channel]}
                      </span>
                      <span className="text-sm font-semibold text-black">{piece.title}</span>
                    </div>
                    <div className="text-xs text-black/60">
                      {piece.date} {piece.time ? `· ${piece.time}` : ""}
                    </div>
                    <div className="text-xs text-black/60">{piece.copy || "Sin copy"}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {piece.publish_state === "queued" || piece.publish_state === "posting" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-black/50" />
                    ) : null}
                    {piece.publish_state === "success" || piece.status === "published" ? (
                      <Check className="h-4 w-4 text-[#1B8A4B]" />
                    ) : null}
                    {piece.publish_state === "error" ? (
                      <X className="h-4 w-4 text-[var(--accent-600)]" />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
