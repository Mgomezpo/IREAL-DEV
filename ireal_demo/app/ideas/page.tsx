"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import * as AlertDialog from "@radix-ui/react-alert-dialog"
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Pin,
  Wand2,
  CalendarPlus,
  ChevronDown,
  ChevronUp,
  Trash2,
  Loader2,
} from "lucide-react"
import { useNavigationState } from "@/hooks/useNavigationState"
import { useIdeasData } from "@/hooks/useIdeasData"
import { isIdeaPlanStabilityEnabled } from "@/lib/feature-flags"
import { PlanConnectorModal } from "@/components/plan-connector-modal"

interface Idea extends IdeaRecord {
  channel?: "IG" | "YT" | "X" | "LI" | "GEN"
  priority?: "low" | "medium" | "high"
  status: "active" | "archived"
  pinned: boolean
  linked_plan_ids?: string[]
}

interface IdeasGroup {
  title: string
  dateRange: string
  ideas: Idea[]
  isCollapsed: boolean
}

export default function Ideas() {
  const ideaPlanEnabled = isIdeaPlanStabilityEnabled()
  return ideaPlanEnabled ? <EnhancedIdeas /> : <LegacyIdeas />
}

function LegacyIdeas() {
  const router = useRouter()
  const { registerState } = useNavigationState()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [groups, setGroups] = useState<IdeasGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  const fetchIdeas = useCallback(
    async (search?: string) => {
      try {
        setLoading(true)
        setError(null)

        const url = search ? `/api/ideas?search=${encodeURIComponent(search)}` : "/api/ideas"
        const response = await fetch(url)

        if (response.status === 401 || response.status === 403) {
          console.error("[v0] Unauthorized access, redirecting to auth")
          router.push("/auth")
          return
        }

        if (!response.ok) {
          throw new Error("Failed to fetch ideas")
        }

        const data = await response.json()
        setIdeas(data)
        setGroups(groupIdeasByTime(data))
      } catch (err) {
        console.error("[v0] Error fetching ideas:", err)
        setError("Error al cargar ideas. Por favor, intenta de nuevo.")
      } finally {
        setLoading(false)
      }
    },
    [router],
  )

  useEffect(() => {
    fetchIdeas()
  }, [fetchIdeas])

  useEffect(() => {
    registerState({ searchQuery, timestamp: Date.now() })
  }, [registerState, searchQuery])

  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    const timeout = setTimeout(() => {
      if (searchQuery.trim()) {
        fetchIdeas(searchQuery.trim())
      } else {
        fetchIdeas()
      }
    }, 300)

    setSearchTimeout(timeout)

    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [searchQuery])

  const groupIdeasByTime = (ideas: Idea[]): IdeasGroup[] => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 86400000)
    const weekAgo = new Date(today.getTime() - 7 * 86400000)

    const groups: IdeasGroup[] = [
      {
        title: "Hoy",
        dateRange: today.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "long" }),
        ideas: [],
        isCollapsed: false,
      },
      {
        title: "Ayer",
        dateRange: yesterday.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "long" }),
        ideas: [],
        isCollapsed: false,
      },
      {
        title: "Semana pasada",
        dateRange: `${weekAgo.getDate()}-${today.getDate()} ${today.toLocaleDateString("es-ES", { month: "short" })}`,
        ideas: [],
        isCollapsed: false,
      },
    ]

    ideas.forEach((idea) => {
      const ideaDate = new Date(idea.created_at)
      if (ideaDate >= today) {
        groups[0].ideas.push(idea)
      } else if (ideaDate >= yesterday) {
        groups[1].ideas.push(idea)
      } else if (ideaDate >= weekAgo) {
        groups[2].ideas.push(idea)
      }
    })

    return groups.filter((group) => group.ideas.length > 0)
  }

  const handleNavigation = (path: string) => {
    setIsTransitioning(true)
    setTimeout(() => {
      router.push(path)
    }, 350)
  }

  const toggleGroupCollapse = (groupIndex: number) => {
    setGroups((prev) =>
      prev.map((group, index) => (index === groupIndex ? { ...group, isCollapsed: !group.isCollapsed } : group)),
    )
  }

  const handleDeleteIdea = async (ideaId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta idea?")) {
      return
    }

    try {
      const response = await fetch(`/api/ideas/${ideaId}`, {
        method: "DELETE",
      })

      if (response.status === 401 || response.status === 403) {
        console.error("[v0] Unauthorized access, redirecting to auth")
        router.push("/auth")
        return
      }

      if (!response.ok) {
        throw new Error("Failed to delete idea")
      }

      // Update local state without reloading
      setIdeas((prev) => prev.filter((idea) => idea.id !== ideaId))
      setGroups((prev) =>
        prev
          .map((group) => ({
            ...group,
            ideas: group.ideas.filter((idea) => idea.id !== ideaId),
          }))
          .filter((group) => group.ideas.length > 0),
      )
    } catch (err) {
      console.error("[v0] Error deleting idea:", err)
      alert("Error al eliminar la idea. Por favor, intenta de nuevo.")
  }
}

function EnhancedIdeas() {
  const router = useRouter()
  const { registerState, currentState } = useNavigationState()
  const storedFilters = currentState?.ideasFilters as { month?: string; day?: number } | undefined
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [searchQuery, setSearchQuery] = useState(
    typeof currentState?.searchQuery === "string" ? (currentState.searchQuery as string) : "",
  )
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)
  const initialMonth = useMemo(() => {
    if (storedFilters?.month) {
      const parsed = new Date(storedFilters.month)
      if (!Number.isNaN(parsed.getTime())) {
        return parsed
      }
    }
    return new Date()
  }, [storedFilters?.month])
  const [calendarMonth, setCalendarMonth] = useState<Date>(initialMonth)
  const [selectedDay, setSelectedDay] = useState<number | null>(() => {
    return typeof storedFilters?.day === "number" ? storedFilters.day : null
  })
  const [deleteTarget, setDeleteTarget] = useState<Idea | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [connectorIdea, setConnectorIdea] = useState<Idea | null>(null)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim())
    }, 250)
    return () => clearTimeout(timeout)
  }, [searchQuery])

  useEffect(() => {
    console.info("[ideas] IDEA_PLAN_STABILITY on: filters + plan connector enabled")
  }, [])

  useEffect(() => {
    registerState({
      searchQuery,
      ideasFilters: { month: calendarMonth.toISOString(), day: selectedDay },
      timestamp: Date.now(),
    })
  }, [registerState, searchQuery, calendarMonth, selectedDay])

  const { ideas, loading, error, refresh, stats } = useIdeasData(debouncedSearch || undefined)

  const filteredIdeas = useMemo(
    () => filterIdeasByCalendar((ideas as Idea[]) ?? [], calendarMonth, selectedDay ?? undefined),
    [ideas, calendarMonth, selectedDay],
  )
  const groups = useMemo(() => buildIdeaGroups(filteredIdeas), [filteredIdeas])

  const handleNavigation = (path: string) => {
    setIsTransitioning(true)
    setTimeout(() => router.push(path), 200)
  }

  const handleDeleteIdea = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      const response = await fetch(`/api/ideas/${deleteTarget.id}`, { method: "DELETE" })
      if (!response.ok) {
        throw new Error("delete failed")
      }
      console.info("[ideas] Idea deleted", { ideaId: deleteTarget.id })
      refresh()
      setDeleteTarget(null)
    } catch (err) {
      console.error("[ideas] Error deleting idea", err)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleIdeaAction = (idea: Idea, action: string) => {
    if (action === "delete") {
      setDeleteTarget(idea)
      return
    }
    if (action === "convert") {
      setConnectorIdea(idea)
      return
    }
    if (action === "open") {
      handleNavigation(`/ideas/${idea.id}`)
      return
    }
  }

  const goToNewIdea = () => handleNavigation("/ideas/new")

  return (
    <div className={`min-h-screen bg-[var(--surface)] ${isTransitioning ? "notebook-exit" : "notebook-enter"}`}>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleNavigation("/dashboard")}
              className="rounded-lg p-2 transition-colors hover:bg-black/5"
              aria-label="Volver al dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-black">Ideas</h1>
              <p className="text-sm text-black/60">
                {stats.total} ideas · {stats.today} hoy · {stats.thisWeek} esta semana
              </p>
            </div>
          </div>

          <button
            onClick={goToNewIdea}
            className="rounded-sm px-4 py-2 text-sm font-medium text-black transition-all duration-200 ring-1 ring-transparent hover:bg-[var(--accent-600)] hover:text-white hover:ring-[var(--accent-600)]/70 hover:shadow-[0_0_0_6px_rgba(138,15,28,0.10)]"
          >
            <Plus className="mr-2 inline h-4 w-4" />
            Nueva idea
          </button>
        </div>

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label htmlFor="ideas-search" className="sr-only">
              Buscar ideas
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
              <input
                id="ideas-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar idea..."
                className="w-full rounded-lg border border-black/10 bg-white/70 py-3 pl-9 pr-4 text-sm text-black placeholder:text-black/40 focus:border-black focus:outline-none focus:ring-0"
              />
            </div>
          </div>
          <div className="w-full md:w-auto">
            <MiniCalendarFilter
              monthDate={calendarMonth}
              selectedDay={selectedDay ?? undefined}
              onMonthChange={(date) => setCalendarMonth(date)}
              onDayChange={(day) => setSelectedDay(day ?? null)}
            />
          </div>
        </div>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {loading && filteredIdeas.length === 0 ? (
          <div className="space-y-3 rounded-xl border border-black/5 bg-white/50 p-6 text-sm text-black/60">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando ideas...
          </div>
        ) : filteredIdeas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/10 bg-white/40 p-8 text-center text-sm text-black/60">
            No hay ideas para este filtro. Ajusta el mes o crea una nueva idea.
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <section key={group.title} className="rounded-xl border border-[#E5E5E5] bg-white/40 p-5">
                <header className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-black">{group.title}</h2>
                    <p className="text-sm text-black/50">{group.dateRange}</p>
                  </div>
                  <span className="text-sm text-black/50">{group.ideas.length} ideas</span>
                </header>
                <div className="space-y-3">
                  {group.ideas.map((idea) => (
                    <EnhancedIdeaRow key={idea.id} idea={idea} onAction={handleIdeaAction} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <PlanConnectorModal
        ideaId={connectorIdea?.id ?? null}
        ideaTitle={connectorIdea?.title}
        open={Boolean(connectorIdea)}
        onClose={() => setConnectorIdea(null)}
        onAttached={() => refresh()}
      />

      <AlertDialog.Root open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/30 z-40" />
          <AlertDialog.Content className="fixed inset-x-0 top-1/2 z-50 mx-auto max-w-lg -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl focus:outline-none">
            <AlertDialog.Title className="text-xl font-semibold text-black">Eliminar idea</AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-black/70">
              ¿Seguro que quieres eliminar{" "}
              <span className="font-medium">{deleteTarget?.title || "esta idea"}</span>? Esta acción no se puede deshacer.
            </AlertDialog.Description>
            <div className="mt-5 flex justify-end gap-3">
              <AlertDialog.Cancel className="rounded-md border border-black/10 px-4 py-2 text-sm text-black hover:bg-black/5">
                Cancelar
              </AlertDialog.Cancel>
              <button
                onClick={handleDeleteIdea}
                disabled={deleteLoading}
                className="rounded-md bg-[var(--accent-600)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-700)] disabled:opacity-60"
              >
                {deleteLoading ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  )
}

  const handleIdeaAction = (ideaId: string, action: string) => {
    if (action === "delete") {
      handleDeleteIdea(ideaId)
    } else {
      console.log(`[v0] Idea action: ${action} for idea ${ideaId}`)
    }
  }

  if (loading && ideas.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--surface)]">
        <div className="max-w-6xl md:max-w-7xl mx-auto px-6 py-10">
          <div className="animate-pulse" role="status" aria-live="polite" aria-label="Cargando ideas">
            <div className="h-8 bg-black/5 rounded w-32 mb-2"></div>
            <div className="h-4 bg-black/5 rounded w-64 mb-8"></div>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-black/5 rounded mb-3"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-[var(--surface)] ${isTransitioning ? "notebook-exit" : "notebook-enter"}`}>
      <div className="max-w-6xl md:max-w-7xl mx-auto px-6 py-10">
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {loading && "Cargando ideas"}
          {!loading && ideas.length > 0 && `${ideas.length} ideas cargadas`}
          {!loading && ideas.length === 0 && "No hay ideas"}
        </div>

        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleNavigation("/dashboard")}
              className="p-2 hover:bg-black/5 rounded-lg transition-colors"
              aria-label="Volver al dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl tracking-tight font-semibold font-display text-black">Ideas</h1>
              <p className="text-black/70 mt-1 text-sm md:text-base">
                Apunta chispas. Convierte notas en planes cuando estés listo.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNavigation("/ideas/new")}
              className="group relative text-base text-black hover:text-white hover:bg-[var(--accent-600)] rounded-sm ring-1 ring-transparent hover:ring-[var(--accent-600)]/70 hover:shadow-[0_0_0_6px_rgba(138,15,28,0.10)] px-4 py-2 transition-all duration-200 font-medium"
            >
              <Plus className="h-4 w-4 inline mr-2" />
              Nueva idea
            </button>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-600)]/20 text-sm"
              />
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
            </div>
            <button className="p-2 hover:bg-black/5 rounded-lg transition-colors" title="Filtros">
              <Filter className="h-5 w-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm" role="alert">
            {error}
          </div>
        )}

        {groups.length === 0 && !loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 text-black/40" />
            </div>
            <h3 className="font-display text-xl font-semibold text-black mb-2">
              {searchQuery ? "No se encontraron ideas" : "No tienes ideas todavía"}
            </h3>
            <p className="text-black/60 mb-6 max-w-sm mx-auto">
              {searchQuery
                ? "Intenta con otros términos de búsqueda"
                : "Crea tu primera idea usando el botón Nueva idea ✨"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((group, groupIndex) => (
              <div key={group.title} className="space-y-3">
                <div className="sticky top-20 z-5 bg-[var(--surface)]/95 backdrop-blur py-2">
                  <button
                    onClick={() => toggleGroupCollapse(groupIndex)}
                    className="flex items-center gap-2 w-full text-left hover:bg-black/5 rounded-lg px-2 py-1 transition-colors"
                  >
                    <h2 className="font-display text-lg font-semibold text-black">{group.title}</h2>
                    <span className="text-black/60 text-sm">
                      — {group.dateRange} · {group.ideas.length} nota{group.ideas.length !== 1 ? "s" : ""}
                    </span>
                    {group.isCollapsed ? (
                      <ChevronDown className="h-4 w-4 text-black/40 ml-auto" />
                    ) : (
                      <ChevronUp className="h-4 w-4 text-black/40 ml-auto" />
                    )}
                  </button>
                </div>

                {!group.isCollapsed && (
                  <div className="space-y-2">
                    {group.ideas.map((idea) => (
                      <LegacyIdeaRow
                        key={idea.id}
                        idea={idea}
                        onAction={handleIdeaAction}
                        onClick={() => handleNavigation(`/ideas/${idea.id}`)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface LegacyIdeaRowProps {
  idea: Idea
  onAction: (ideaId: string, action: string) => void
  onClick: () => void
}

function LegacyIdeaRow({ idea, onAction, onClick }: LegacyIdeaRowProps) {
  const [showActions, setShowActions] = useState(false)

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("es-ES", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const getChannelColor = (channel?: string) => {
    switch (channel) {
      case "IG":
        return "bg-pink-100 text-pink-800"
      case "YT":
        return "bg-red-100 text-red-800"
      case "X":
        return "bg-gray-100 text-gray-800"
      case "LI":
        return "bg-blue-100 text-blue-800"
      case "GEN":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-600"
    }
  }

  return (
    <div
      className="group rounded-md border border-[#E5E5E5] bg-white/50 px-3 py-2 hover:bg-white/70 hover:shadow-sm transition-all cursor-pointer"
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {idea.pinned && <Pin className="h-3 w-3 text-[var(--accent-600)] flex-shrink-0" />}
            <h3 className="font-medium text-black truncate" title={idea.title}>
              {idea.title}
            </h3>
          </div>

          {idea.channel && (
            <div className="flex items-center gap-1 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full ${getChannelColor(idea.channel)}`}>
                {idea.channel}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-4">
          <span className="text-xs text-black/60 whitespace-nowrap">{formatTime(idea.updated_at)}</span>

          <div className={`flex items-center transition-opacity ${showActions ? "opacity-100" : "opacity-0"}`}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAction(idea.id, "pin")
              }}
              className="p-1 hover:bg-black/10 rounded transition-colors"
              title="Pinear (P)"
            >
              <Pin className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAction(idea.id, "convert")
              }}
              className="p-1 hover:bg-black/10 rounded transition-colors"
              title="Convertir a plan (C)"
            >
              <Wand2 className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAction(idea.id, "schedule")
              }}
              className="p-1 hover:bg-black/10 rounded transition-colors"
              title="Programar (S)"
            >
              <CalendarPlus className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAction(idea.id, "delete")
              }}
              className="p-1 hover:bg-red-100 hover:text-red-600 rounded transition-colors"
              title="Eliminar"
            >
              <Trash2 className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowActions(false)
              }}
              className="p-1 hover:bg-black/10 rounded transition-colors"
              title="Más opciones"
            >
              <MoreVertical className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface CalendarFilterProps {
  monthDate: Date
  selectedDay?: number
  onMonthChange: (next: Date) => void
  onDayChange: (day?: number) => void
}

function MiniCalendarFilter({ monthDate, selectedDay, onMonthChange, onDayChange }: CalendarFilterProps) {
  const daysInMonth = useMemo(() => new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate(), [monthDate])
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const shiftMonth = (delta: number) => {
    const next = new Date(monthDate)
    next.setDate(1)
    next.setMonth(monthDate.getMonth() + delta)
    onMonthChange(next)
  }

  return (
    <div className="rounded-xl border border-black/10 bg-white/70 p-4 text-sm">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => shiftMonth(-1)} className="rounded-md border border-black/10 px-2 py-1 text-black/60">
          ←
        </button>
        <span className="font-semibold text-black">
          {monthDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
        </span>
        <button onClick={() => shiftMonth(1)} className="rounded-md border border-black/10 px-2 py-1 text-black/60">
          →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isSelected = selectedDay === day
          return (
            <button
              key={day}
              onClick={() => onDayChange(isSelected ? undefined : day)}
              className={`rounded-md py-1 text-xs ${
                isSelected ? "bg-[var(--accent-600)] text-white" : "bg-white text-black/70"
              }`}
            >
              {day}
            </button>
          )
        })}
      </div>
      <button
        onClick={() => onDayChange(undefined)}
        className="mt-2 w-full rounded-md border border-black/10 px-2 py-1 text-xs text-black/60 hover:bg-black/5"
      >
        Limpiar día
      </button>
    </div>
  )
}

function filterIdeasByCalendar(ideas: Idea[], month: Date, day?: number) {
  const key = getMonthKey(month)
  return ideas.filter((idea) => {
    const created = new Date(idea.created_at || idea.updated_at)
    if (getMonthKey(created) !== key) return false
    if (day && created.getDate() !== day) return false
    return true
  })
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

function buildIdeaGroups(ideas: Idea[]): IdeasGroup[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const weekAgo = new Date(today.getTime() - 7 * 86400000)

  const groups: IdeasGroup[] = [
    {
      title: "Hoy",
      dateRange: today.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "long" }),
      ideas: [],
      isCollapsed: false,
    },
    {
      title: "Ayer",
      dateRange: yesterday.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "long" }),
      ideas: [],
      isCollapsed: false,
    },
    {
      title: "Semana pasada",
      dateRange: `${weekAgo.getDate()}-${today.getDate()} ${today.toLocaleDateString("es-ES", { month: "short" })}`,
      ideas: [],
      isCollapsed: false,
    },
    {
      title: "Anteriores",
      dateRange: "Más de una semana",
      ideas: [],
      isCollapsed: true,
    },
  ]

  ideas.forEach((idea) => {
    const ideaDate = new Date(idea.created_at || idea.updated_at)
    const ideaDay = new Date(ideaDate.getFullYear(), ideaDate.getMonth(), ideaDate.getDate())

    if (ideaDay.getTime() === today.getTime()) {
      groups[0].ideas.push(idea)
    } else if (ideaDay.getTime() === yesterday.getTime()) {
      groups[1].ideas.push(idea)
    } else if (ideaDay >= weekAgo) {
      groups[2].ideas.push(idea)
    } else {
      groups[3].ideas.push(idea)
    }
  })

  return groups
}

interface EnhancedIdeaRowProps {
  idea: Idea
  onAction: (idea: Idea, action: string) => void
}

function EnhancedIdeaRow({ idea, onAction }: EnhancedIdeaRowProps) {
  const [showActions, setShowActions] = useState(false)
  const timeLabel = new Date(idea.updated_at).toLocaleTimeString("es-ES", {
    hour: "numeric",
    minute: "2-digit",
  })

  return (
    <div
      className="flex items-start justify-between rounded-lg border border-[#E5E5E5] bg-white/60 px-3 py-2 transition hover:bg-white"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <button onClick={() => onAction(idea, "open")} className="flex-1 text-left">
        <p className="font-medium text-black">{idea.title || "Idea sin título"}</p>
        {idea.channel && <p className="text-xs text-black/50">Canal: {idea.channel}</p>}
      </button>
      <div className="flex items-center gap-2 text-xs text-black/50">
        {timeLabel}
        <div className={`flex items-center gap-1 transition-opacity ${showActions ? "opacity-100" : "opacity-0"}`}>
          <button
            onClick={() => onAction(idea, "convert")}
            className="rounded-md p-1 text-black/60 hover:bg-black/10"
            title="Conectar plan"
          >
            <Wand2 className="h-3 w-3" />
          </button>
          <button
            onClick={() => onAction(idea, "delete")}
            className="rounded-md p-1 text-[var(--accent-600)] hover:bg-[var(--accent-600)]/10"
            title="Eliminar"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  )
}
