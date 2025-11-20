"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Pin,
  Wand2,
  CalendarPlus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react"
import { useNavigationState } from "@/hooks/useNavigationState"
import type { Idea, IdeasGroup } from "../types"

function groupIdeasByTime(ideas: Idea[]): IdeasGroup[] {
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
    const ideaDate = new Date(idea.created_at || idea.updated_at)
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

export default function LegacyIdeas() {
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
          router.push("/auth")
          return
        }

        if (!response.ok) {
          throw new Error("Failed to fetch ideas")
        }

        const data = (await response.json()) as Idea[]
        setIdeas(data)
        setGroups(groupIdeasByTime(data))
      } catch (err) {
        console.error("[ideas] Error fetching ideas:", err)
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
  }, [searchQuery, fetchIdeas])

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
        router.push("/auth")
        return
      }

      if (!response.ok) {
        throw new Error("Failed to delete idea")
      }

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
      console.error("[ideas] Error deleting idea:", err)
      alert("Error al eliminar la idea. Por favor, intenta de nuevo.")
    }
  }

  const handleIdeaAction = (ideaId: string, action: string) => {
    if (action === "delete") {
      handleDeleteIdea(ideaId)
    } else {
      console.log(`[ideas] Acción ${action} para la idea ${ideaId}`)
    }
  }

  if (loading && ideas.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--surface)]">
        <div className="max-w-6xl md:max-w-7xl mx-auto px-6 py-10">
          <div className="animate-pulse" role="status" aria-live="polite" aria-label="Cargando ideas">
            <div className="mb-2 h-8 w-32 rounded bg-black/5" />
            <div className="mb-8 h-4 w-64 rounded bg-black/5" />
            {[...Array(6)].map((_, i) => (
              <div key={i} className="mb-3 h-16 rounded bg-black/5" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-[var(--surface)] ${isTransitioning ? "notebook-exit" : "notebook-enter"}`}>
      <div className="max-w-6xl md:max-w-7xl mx-auto px-6 py-10">
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
              title="Pinear"
            >
              <Pin className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAction(idea.id, "convert")
              }}
              className="p-1 hover:bg-black/10 rounded transition-colors"
              title="Convertir a plan"
            >
              <Wand2 className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAction(idea.id, "schedule")
              }}
              className="p-1 hover:bg-black/10 rounded transition-colors"
              title="Programar"
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
