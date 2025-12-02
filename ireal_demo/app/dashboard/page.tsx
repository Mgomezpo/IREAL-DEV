"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Plus, Feather, FileText, CalendarCheck2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useIdeasData } from "@/hooks/useIdeasData"
import { HardCard } from "@/components/ui/hard-card"

export default function DashboardPage() {
  const router = useRouter()
  const [promptQuestion, setPromptQuestion] = useState<string | null>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [plansLoading, setPlansLoading] = useState(false)
  const hasLoadedQuestion = useRef(false)

  const { ideas: liveIdeas, stats: ideaStats } = useIdeasData()
  const formattedIdeas = useMemo(
    () =>
      (liveIdeas ?? []).slice(0, 3).map((idea: any) => ({
        id: idea.id,
        title: idea.title,
        meta: idea.created_at ? new Date(idea.created_at).toLocaleDateString("es-ES") : idea.meta ?? "",
        href: idea.href ?? `/ideas/${idea.id}`,
      })),
    [liveIdeas],
  )

  const formattedPlans = useMemo(
    () =>
      (plans ?? []).slice(0, 3).map((plan: any) => ({
        id: plan.id,
        title: plan.name || plan.title || "Plan sin nombre",
        meta: `${plan.status ?? "Borrador"} · ${plan.progress?.overall ?? 0}%`,
        href: `/planes/${plan.id}`,
      })),
    [plans],
  )

  const weekCount = ideaStats?.thisWeek ?? 0
  const today: { title: string; status: string }[] = []
  const yesterday: { title: string; status: string }[] = []
  const tomorrow: { title: string; status: string }[] = []

  const handleNavigation = (path: string) => router.push(path)
  const handleNewIdea = () => handleNavigation("/ideas/new")

  useEffect(() => {
    // Try to seed with previous question to avoid flicker while fetching a new one.
    if (typeof window !== "undefined") {
      const cached = window.localStorage.getItem("dashboard:promptQuestion")
      if (cached) {
        setPromptQuestion(cached)
      }
    }
  }, [])

  useEffect(() => {
    if (hasLoadedQuestion.current) return
    hasLoadedQuestion.current = true

    const loadQuestion = async () => {
      try {
        const res = await fetch("/api/random-question")
        if (!res.ok) throw new Error("Failed to load question")
        const data = await res.json()
        const question = data?.question ?? null
        if (question) {
          setPromptQuestion(question)
          window?.localStorage?.setItem("dashboard:promptQuestion", question)
        }
      } catch (error) {
        console.error("[dashboard] Failed to fetch random question", error)
        setPromptQuestion("¿Qué quieres crear hoy?")
      }
    }
    loadQuestion()
  }, [])

  useEffect(() => {
    const loadPlans = async () => {
      try {
        setPlansLoading(true)
        const res = await fetch("/api/plans")
        if (!res.ok) throw new Error("Failed to load plans")
        const data = await res.json()
        setPlans(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("[dashboard] Failed to fetch plans", error)
        setPlans([])
      } finally {
        setPlansLoading(false)
      }
    }
    loadPlans()
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      <PageHeader
        title={promptQuestion ?? ""}
        actions={
          <button
            onClick={handleNewIdea}
            className="group relative text-base text-black hover:text-white hover:bg-[var(--accent-600)] rounded-sm ring-1 ring-transparent hover:ring-[var(--accent-600)]/70 hover:shadow-[0_0_0_6px_rgba(138,15,28,0.10)] px-4 py-2 transition-all duration-200 font-medium"
          >
            <Plus className="h-4 w-4 inline mr-2" />
            Nueva idea
          </button>
        }
      />

      <div className="grid gap-6 md:grid-cols-3 items-start">
        <CardList
          icon={Feather}
          title="Ideas"
          items={formattedIdeas}
          onViewAll={() => handleNavigation("/ideas")}
          emptyState={{
            message: "Aún no hay ideas. Empieza una idea.",
            cta: "Nueva idea",
            onCta: () => handleNavigation("/ideas/new"),
          }}
          type="ideas"
        />

        <CardList
          icon={FileText}
          title="Planes"
          items={formattedPlans}
          onViewAll={() => handleNavigation("/planes")}
          emptyState={{
            message: plansLoading ? "Cargando planes..." : "Crea tu primer plan.",
            cta: "Nuevo plan",
            onCta: () => handleNavigation("/planes/new"),
          }}
          type="plans"
        />

        <HardCard className="h-full" contentClassName="flex flex-col h-full">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck2 className="h-5 w-5 text-black" aria-hidden="true" />
              <h3 className="font-display text-lg font-semibold text-black">Calendario</h3>
            </div>
            <button
              onClick={() => handleNavigation("/calendario?view=week&focus=today")}
              className="text-sm text-black/70 hover:text-black transition-colors underline decoration-2 underline-offset-4"
            >
              Ver todo
            </button>
          </div>

          <div className="space-y-4 flex-1">
            <p className="text-sm text-black/80">
              <span className="font-semibold">{weekCount}</span> programadas para esta semana
            </p>
            <div className="rounded-lg border border-black/10 bg-white/70 p-3">
              <p className="text-sm font-semibold text-black">Hoy</p>
              <p className="mt-1 text-sm text-black/70">
                Tienes <span className="font-medium">{today.length}</span> contenidos programados
              </p>
            </div>
          </div>
        </HardCard>
      </div>

      <SummaryStrip yesterday={yesterday} today={today} tomorrow={tomorrow} onViewMore={() => handleNavigation("/calendario")} />
    </div>
  )
}

function PageHeader({ title, actions }: { title: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-3xl font-semibold text-[var(--accent-600)] font-display">{title}</p>
      </div>
      {actions}
    </div>
  )
}

interface CardListProps {
  icon: React.FC<React.SVGProps<SVGSVGElement>>
  title: string
  items: { id: string; title: string; meta: string; href: string }[]
  onViewAll: () => void
  emptyState: { message: string; cta: string; onCta: () => void }
  type: "ideas" | "plans"
}

function CardList({ icon: Icon, title, items, onViewAll, emptyState }: CardListProps) {
  return (
    <HardCard className="h-full" contentClassName="flex flex-col h-full">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-black" aria-hidden="true" />
          <h3 className="font-display text-lg font-semibold text-black">{title}</h3>
        </div>
        <button
          onClick={onViewAll}
          className="text-sm text-black/70 hover:text-black transition-colors underline decoration-2 underline-offset-4"
        >
          Ver todo
        </button>
      </div>

      {items.length > 0 ? (
        <ul className="space-y-3 flex-1">
          {items.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onViewAll()}
                className="w-full rounded-lg border-2 border-black/20 bg-white/80 px-3 py-2 text-left transition hover:-translate-y-[1px] hover:border-black/40 hover:shadow-[0_4px_0_rgba(0,0,0,0.15)]"
              >
                <p className="font-semibold text-black">{item.title}</p>
                <p className="text-sm text-black/70">{item.meta}</p>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-lg border border-black/10 bg-white/70 p-4 text-sm text-black/80">
          <p>{emptyState.message}</p>
          <button onClick={emptyState.onCta} className="mt-2 text-[var(--accent-600)] hover:underline font-semibold">
            {emptyState.cta}
          </button>
        </div>
      )}
    </HardCard>
  )
}

function SummaryStrip({
  yesterday,
  today,
  tomorrow,
  onViewMore,
}: {
  yesterday: { title: string; status: string }[]
  today: { title: string; status: string }[]
  tomorrow: { title: string; status: string }[]
  onViewMore: () => void
}) {
  const sections = [
    { label: "Ayer", items: yesterday },
    { label: "Hoy", items: today },
    { label: "Mañana", items: tomorrow },
  ]
  return (
    <HardCard className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-black">Resumen rápido</h3>
          <p className="text-sm text-black/70">Lo esencial de tu calendario mágico.</p>
        </div>
        <button onClick={onViewMore} className="text-sm text-[var(--accent-600)] hover:underline font-semibold">
          Ver calendario
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {sections.map((section) => (
          <div key={section.label} className="rounded-lg border-2 border-black/15 bg-white/80 p-4">
            <h4 className="text-sm font-semibold text-black">{section.label}</h4>
            <ul className="mt-3 space-y-2">
              {section.items.map((item) => (
                <li key={`${section.label}-${item.title}`} className="text-sm text-black/70">
                  {item.title} - <span className="capitalize">{item.status}</span>
                </li>
              ))}
              {section.items.length === 0 && <li className="text-sm text-black/50">Sin elementos</li>}
            </ul>
          </div>
        ))}
      </div>
    </HardCard>
  )
}
