"use client"

import { useMemo, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import * as AlertDialog from "@radix-ui/react-alert-dialog"
import { ArrowLeft, Plus, Search, Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown, ChevronUp } from "lucide-react"
import { PlanConnectorModal } from "@/components/plan-connector-modal"
import { useNavigationState } from "@/hooks/useNavigationState"
import { useIdeasData } from "@/hooks/useIdeasData"
import { groupNotesByDate } from "@/lib/notes"
import type { Idea } from "../types"
import { NotesList } from "./notes-list"

function filterIdeasByCalendar(ideas: Idea[], month: Date, day?: number) {
  // Si no se ha seleccionado un día específico, no filtramos por calendario para mostrar todas las ideas.
  if (!day) return ideas

  const key = getMonthKey(month)
  return ideas.filter((idea) => {
    const created = new Date(idea.created_at || idea.updated_at)
    if (getMonthKey(created) !== key) return false
    return created.getDate() === day
  })
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
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
  const [open, setOpen] = useState(false)

  const shiftMonth = (delta: number) => {
    const next = new Date(monthDate)
    next.setDate(1)
    next.setMonth(monthDate.getMonth() + delta)
    onMonthChange(next)
  }

  return (
    <div className="rounded-xl border border-black/10 bg-white/70 p-3 text-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-md border border-black/10 bg-white/60 px-3 py-2 text-left font-semibold text-black hover:bg-white"
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          <span>{monthDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-black/50" /> : <ChevronDown className="h-4 w-4 text-black/50" />}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between">
            <button onClick={() => shiftMonth(-1)} className="rounded-md border border-black/10 px-2 py-1 text-black/60">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-semibold text-black">
              {monthDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
            </span>
            <button onClick={() => shiftMonth(1)} className="rounded-md border border-black/10 px-2 py-1 text-black/60">
              <ChevronRight className="h-4 w-4" />
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
            className="w-full rounded-md border border-black/10 px-2 py-1 text-xs text-black/60 hover:bg-black/5"
          >
            Limpiar día
          </button>
        </div>
      )}
    </div>
  )
}

export default function EnhancedIdeas() {
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
    registerState({
      searchQuery,
      ideasFilters: { month: calendarMonth.toISOString(), day: selectedDay },
      timestamp: Date.now(),
    })
  }, [registerState, searchQuery, calendarMonth, selectedDay])

  const { ideas: liveIdeas, loading, error, refresh, stats } = useIdeasData(debouncedSearch || undefined)

  const filteredIdeas = useMemo(
    () => filterIdeasByCalendar((liveIdeas as Idea[]) ?? [], calendarMonth, selectedDay ?? undefined),
    [liveIdeas, calendarMonth, selectedDay],
  )
  const groups = useMemo(() => groupNotesByDate(filteredIdeas), [filteredIdeas])

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
      refresh()
      setDeleteTarget(null)
    } catch (err) {
      console.error("[ideas] Error deleting idea", err)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleIdeaAction = (idea: Idea, action: "open" | "delete" | "convert") => {
    if (action === "delete") {
      setDeleteTarget(idea)
      return
    }
    if (action === "convert") {
      setConnectorIdea(idea)
      return
    }
    handleNavigation(`/ideas/${idea.id}`)
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
              onMonthChange={setCalendarMonth}
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
          <NotesList
            groups={groups}
            onSelect={(note) => handleIdeaAction(note as Idea, "open")}
            onConvert={(note) => handleIdeaAction(note as Idea, "convert")}
            onDelete={(note) => handleIdeaAction(note as Idea, "delete")}
          />
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
          <AlertDialog.Overlay className="fixed inset-0 z-40 bg-black/30" />
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
