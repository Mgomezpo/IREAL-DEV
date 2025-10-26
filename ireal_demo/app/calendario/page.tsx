"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Grid3X3,
  List,
  Clock,
  Sparkles,
  Loader2,
  Check,
  X,
} from "lucide-react"

type ViewType = "month" | "week" | "agenda"
type StatusType = "idea" | "draft" | "scheduled" | "published"

interface ContentPiece {
  id: string
  plan_id: string
  title: string
  channel: "IG" | "YT" | "LI" | "X" | "TT" | "FB"
  account_id?: string
  format?: string
  status: StatusType
  date: string
  time?: string
  copy?: string
  script?: string
  target_audience?: string
  autopost_enabled?: boolean
  publish_state?: "idle" | "queued" | "posting" | "success" | "error"
  publish_attempts?: number
  publish_last_error?: string
  publish_permalink?: string
}

const channelIcons = {
  IG: "📷",
  YT: "📺",
  LI: "💼",
  X: "🐦",
  TT: "🎵",
  FB: "👥",
}

export default function Calendario() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showGeneratedMessage, setShowGeneratedMessage] = useState(false)
  const [view, setView] = useState<ViewType>("month")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [pieces, setPieces] = useState<ContentPiece[]>([])
  const [selectedPiece, setSelectedPiece] = useState<ContentPiece | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPieces()
  }, [currentDate])

  const loadPieces = async () => {
    try {
      setLoading(true)
      const month = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`
      const response = await fetch(`/api/pieces?month=${month}`)

      if (response.ok) {
        const data = await response.json()
        setPieces(data.pieces || [])
      } else {
        console.error("[v0] Error loading pieces:", response.statusText)
      }
    } catch (error) {
      console.error("[v0] Error loading pieces:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (searchParams.get("generated") === "true") {
      setShowGeneratedMessage(true)
      setTimeout(() => setShowGeneratedMessage(false), 3000)
    }
  }, [searchParams])

  const handleNavigation = (path: string) => {
    setIsTransitioning(true)
    setTimeout(() => {
      router.push(path)
    }, 350)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      month: "long",
      year: "numeric",
    })
  }

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    newDate.setMonth(currentDate.getMonth() + (direction === "next" ? 1 : -1))
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }

    return days
  }

  const getPiecesForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return pieces.filter((piece) => piece.date === dateStr)
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      today.getDate() === day &&
      today.getMonth() === currentDate.getMonth() &&
      today.getFullYear() === currentDate.getFullYear()
    )
  }

  const getStatusIcon = (piece: ContentPiece) => {
    if (piece.publish_state === "queued" || piece.publish_state === "posting") {
      return <Loader2 className="h-3.5 w-3.5 animate-spin text-black/50" />
    }
    if (piece.publish_state === "success" || piece.status === "published") {
      return <Check className="h-3.5 w-3.5 text-[#1B8A4B]" />
    }
    if (piece.publish_state === "error") {
      return <X className="h-3.5 w-3.5 text-[var(--accent-600)]" />
    }
    return null
  }

  const getStatusColor = (status: StatusType) => {
    switch (status) {
      case "idea":
        return "border-black/15"
      case "draft":
        return "bg-black/5"
      case "scheduled":
        return "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-[var(--accent-400)]"
      case "published":
        return "opacity-80"
      default:
        return ""
    }
  }

  return (
    <div className={`min-h-screen bg-[var(--surface)] ${isTransitioning ? "notebook-exit" : "notebook-enter"}`}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => handleNavigation("/dashboard")}
            className="p-2 hover:bg-black/5 rounded-lg transition-colors"
            aria-label="Volver al dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl tracking-tight font-semibold font-display text-black">Calendario</h1>
            <p className="text-black/70 mt-1 text-sm md:text-base leading-7">Tu cronograma mágico de contenido</p>
          </div>
        </div>

        {/* Generated Message */}
        {showGeneratedMessage && (
          <div className="mb-6 p-4 bg-[var(--accent-600)]/8 border border-[var(--accent-600)]/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[var(--accent-600)]" />
              <p className="text-[var(--accent-600)] font-medium">
                ¡Calendario generado con IA! Revisa las sugerencias y personalízalas.
              </p>
            </div>
          </div>
        )}

        {/* Calendar Controls */}
        <div className="bg-white/40 border border-[#E5E5E5] rounded-xl mb-6">
          <div className="p-4 border-b border-[#E5E5E5]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Date Navigation */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigateMonth("prev")}
                    className="p-2 hover:bg-black/5 rounded-lg transition-colors"
                    aria-label="Mes anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <h2 className="font-display text-lg font-semibold text-black min-w-[200px] text-center capitalize">
                    {formatDate(currentDate)}
                  </h2>
                  <button
                    onClick={() => navigateMonth("next")}
                    className="p-2 hover:bg-black/5 rounded-lg transition-colors"
                    aria-label="Mes siguiente"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={goToToday}
                  className="px-3 py-1.5 text-sm font-medium text-black hover:bg-black/5 rounded-lg transition-colors"
                >
                  Hoy
                </button>
              </div>

              {/* View Controls */}
              <div className="flex items-center gap-2">
                <div className="flex bg-black/5 rounded-lg p-1">
                  <button
                    onClick={() => setView("month")}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      view === "month" ? "bg-white text-black shadow-sm" : "text-black/70 hover:text-black"
                    }`}
                  >
                    <Grid3X3 className="h-4 w-4 md:hidden" />
                    <span className="hidden md:inline">Mes</span>
                  </button>
                  <button
                    onClick={() => setView("week")}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      view === "week" ? "bg-white text-black shadow-sm" : "text-black/70 hover:text-black"
                    }`}
                  >
                    <Clock className="h-4 w-4 md:hidden" />
                    <span className="hidden md:inline">Semana</span>
                  </button>
                  <button
                    onClick={() => setView("agenda")}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      view === "agenda" ? "bg-white text-black shadow-sm" : "text-black/70 hover:text-black"
                    }`}
                  >
                    <List className="h-4 w-4 md:hidden" />
                    <span className="hidden md:inline">Agenda</span>
                  </button>
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="p-2 hover:bg-black/5 rounded-lg transition-colors"
                  aria-label="Filtros"
                >
                  <Filter className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleNavigation("/calendario/nuevo")}
                  className="group relative text-sm text-black hover:text-white hover:bg-[var(--accent-600)] rounded-sm ring-1 ring-transparent hover:ring-[var(--accent-600)]/70 hover:shadow-[0_0_0_6px_rgba(138,15,28,0.10)] px-3 py-2 transition-all duration-200 font-medium"
                >
                  <Plus className="h-4 w-4 inline mr-1" />
                  <span className="hidden sm:inline">Nueva</span>
                </button>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          {view === "month" && (
            <div className="p-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-black/30" />
                </div>
              ) : (
                <>
                  {/* Days of week header */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
                      <div key={day} className="p-2 text-center text-sm font-medium text-black/60">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar days */}
                  <div className="grid grid-cols-7 gap-1">
                    {getDaysInMonth().map((day, index) => (
                      <div
                        key={index}
                        className={`min-h-[100px] p-2 border border-[#E5E5E5] rounded-lg bg-white/20 ${
                          day && isToday(day) ? "ring-2 ring-[var(--accent-600)]" : ""
                        } ${day ? "hover:bg-white/40 cursor-pointer" : ""}`}
                        onDoubleClick={() =>
                          day &&
                          handleNavigation(
                            `/calendario/nuevo?date=${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
                          )
                        }
                      >
                        {day && (
                          <>
                            <div className="text-sm font-medium text-black mb-2">{day}</div>
                            <div className="space-y-1">
                              {getPiecesForDate(day)
                                .slice(0, 3)
                                .map((piece) => (
                                  <div
                                    key={piece.id}
                                    onClick={() => setSelectedPiece(piece)}
                                    className={`relative rounded-md border border-[#E5E5E5] bg-white/70 px-2 py-1 text-xs cursor-pointer hover:bg-white/90 transition-colors ${getStatusColor(piece.status)}`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1 flex-1 min-w-0">
                                        <span className="text-xs">{channelIcons[piece.channel]}</span>
                                        <span className="truncate font-medium">{piece.title}</span>
                                      </div>
                                      <div className="absolute right-1 top-1">{getStatusIcon(piece)}</div>
                                    </div>
                                    {piece.time && <div className="text-xs text-black/50 mt-0.5">{piece.time}</div>}
                                  </div>
                                ))}
                              {getPiecesForDate(day).length > 3 && (
                                <div className="text-xs text-black/50 text-center py-1">
                                  +{getPiecesForDate(day).length - 3} más
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Week View Placeholder */}
          {view === "week" && (
            <div className="p-8 text-center">
              <Clock className="h-12 w-12 text-black/20 mx-auto mb-4" />
              <h3 className="font-display text-lg font-semibold text-black mb-2">Vista Semanal</h3>
              <p className="text-black/60">Próximamente: vista detallada por horas</p>
            </div>
          )}

          {/* Agenda View Placeholder */}
          {view === "agenda" && (
            <div className="p-8 text-center">
              <List className="h-12 w-12 text-black/20 mx-auto mb-4" />
              <h3 className="font-display text-lg font-semibold text-black mb-2">Vista Agenda</h3>
              <p className="text-black/60">Próximamente: lista cronológica de publicaciones</p>
            </div>
          )}
        </div>

        {/* Piece Modal */}
        {selectedPiece && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-start justify-center pt-16">
            <div className="max-w-3xl w-[92vw] md:w-auto mx-auto rounded-2xl border border-[#E5E5E5] bg-white/70 shadow-lg">
              {/* Modal Header */}
              <div className="p-6 border-b border-[#E5E5E5] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{channelIcons[selectedPiece.channel]}</span>
                  <input
                    type="text"
                    value={selectedPiece.title}
                    className="font-display text-lg font-semibold bg-transparent border-none outline-none text-black"
                    readOnly
                  />
                </div>
                <div className="w-32 h-20 rounded-md border border-dashed border-[#E5E5E5] bg-white/50 p-2 flex items-center justify-center text-xs text-black/50">
                  Subir archivo
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Copy</label>
                    <textarea
                      rows={4}
                      value={selectedPiece.copy || ""}
                      className="w-full px-3 py-2 border border-[#E5E5E5] rounded-lg bg-white/50 text-sm resize-none"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Guion / Script</label>
                    <textarea
                      rows={5}
                      value={selectedPiece.script || "Guion generado automáticamente..."}
                      className="w-full px-3 py-2 border border-[#E5E5E5] rounded-lg bg-white/50 text-sm resize-none"
                      readOnly
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Público objetivo</label>
                    <input
                      type="text"
                      value={selectedPiece.target_audience || "Emprendedores y profesionales"}
                      className="w-full px-3 py-2 border border-[#E5E5E5] rounded-lg bg-white/50 text-sm"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Cuenta de referencia</label>
                    <select
                      className="w-full px-3 py-2 border border-[#E5E5E5] rounded-lg bg-white/50 text-sm"
                      disabled
                    >
                      <option>@mi_cuenta_principal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Plan de referencia</label>
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1.5 bg-black/5 rounded-lg text-sm">Plan Enero 2024</span>
                      <button className="text-sm text-[var(--accent-600)] hover:underline">Abrir plan</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-[#E5E5E5] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded-md text-xs font-medium ${
                      selectedPiece.status === "scheduled"
                        ? "bg-[var(--accent-600)]/10 text-[var(--accent-600)]"
                        : selectedPiece.status === "published"
                          ? "bg-green-100 text-green-700"
                          : selectedPiece.status === "draft"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {selectedPiece.status === "scheduled"
                      ? "Programado"
                      : selectedPiece.status === "published"
                        ? "Publicado"
                        : selectedPiece.status === "draft"
                          ? "Borrador"
                          : "Idea"}
                  </span>
                  {selectedPiece.autopost_enabled && (
                    <span className="text-xs text-black/50">• Autopublicar activado</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button className="px-4 py-2 text-sm font-medium text-black hover:bg-black/5 rounded-lg transition-colors">
                    Guardar
                  </button>
                  <button className="px-4 py-2 text-sm font-medium text-black hover:text-white hover:bg-[var(--accent-600)] rounded-sm ring-1 ring-transparent hover:ring-[var(--accent-600)]/70 transition-all duration-200">
                    Programar
                  </button>
                  <button
                    onClick={() => setSelectedPiece(null)}
                    className="px-4 py-2 text-sm font-medium text-black/60 hover:text-black transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
