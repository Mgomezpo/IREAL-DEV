"use client"

import type React from "react"
import { useMemo, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Feather,
  FileText,
  CalendarCheck2,
  Library,
  BarChart3,
  Settings,
  ChevronRight,
  Plus,
  Menu,
  X,
  LogOut,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useIdeasData } from "@/hooks/useIdeasData"
import { isIdeaPlanStabilityEnabled } from "@/lib/feature-flags"

const mockIdeas = [
  { id: "i1", title: "Checklist pre-publicación", meta: "Ayer 9:40", href: "/ideas/i1" },
  { id: "i2", title: "10 tips para creadores", meta: "Hace 2 días", href: "/ideas/i2" },
  { id: "i3", title: "Estrategia de contenido Q1", meta: "Hace 3 días", href: "/ideas/i3" },
]

const mockPlans = [
  { id: "p1", title: "Campaña de lanzamiento", status: "Activo", progress: 75, href: "/planes/p1" },
  { id: "p2", title: "Serie educativa YouTube", status: "Borrador", progress: 30, href: "/planes/p2" },
]

const mockSummary = {
  weekCount: 12,
  yesterday: [
    { title: "Post Instagram stories", status: "publicado" },
    { title: "Newsletter semanal", status: "publicado" },
  ],
  today: [
    { title: "Video TikTok", status: "programado" },
    { title: "Thread Twitter", status: "programado" },
    { title: "Post LinkedIn", status: "programado" },
  ],
  tomorrow: [
    { title: "Reel Instagram", status: "programado" },
    { title: "Story highlights", status: "programado" },
  ],
}

export default function DashboardPage() {
  const router = useRouter()
  const [isTransitioning] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const ideaPlanEnabled = isIdeaPlanStabilityEnabled()

  const { ideas: liveIdeas, stats: ideaStats } = useIdeasData()
  const ideaSource = ideaPlanEnabled && liveIdeas.length ? liveIdeas : mockIdeas
  const formattedIdeas = useMemo(
    () =>
      ideaSource.slice(0, 3).map((idea: any) => ({
        id: idea.id,
        title: idea.title,
        meta: idea.created_at ? new Date(idea.created_at).toLocaleDateString("es-ES") : idea.meta ?? "",
        href: idea.href ?? `/ideas/${idea.id}`, 
      })),
    [ideaSource],
  )

  const formattedPlans = useMemo(
    () =>
      mockPlans.map((plan) => ({
        id: plan.id,
        title: plan.title,
                meta: `${plan.status} · ${plan.progress}%`,
        href: plan.href,
      })),
    [],
  )

  const weekCount = ideaPlanEnabled ? ideaStats.thisWeek : mockSummary.weekCount
  const today = ideaPlanEnabled ? [] : mockSummary.today
  const yesterday = ideaPlanEnabled ? [] : mockSummary.yesterday
  const tomorrow = ideaPlanEnabled ? [] : mockSummary.tomorrow

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  const handleNewIdea = () => {
    handleNavigation("/ideas/new")
  }

  const mainContent = (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <PageHeader
        title="Tu página de hoy"
        subtitle="Convierte tu idea en un hechizo de contenido."
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

      <div className="grid gap-6 md:grid-cols-3">
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
            message: "Crea tu primer plan y el cuaderno cobrará vida.",
            cta: "Nuevo plan",
            onCta: () => handleNavigation("/planes/nuevo"),
          }}
          type="plans"
        />

        <div className="rounded-xl border border-[#E5E5E5] bg-white/40 p-5 hover:shadow-sm transition-shadow">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck2 className="h-5 w-5 text-black/60" aria-hidden="true" />
              <h3 className="font-medium text-black">Publicaciones</h3>
            </div>
            <button
              onClick={() => handleNavigation("/calendario?view=week&focus=today")}
              className="text-sm text-black/60 hover:text-black transition-colors"
            >
              Ver todo
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-black/70">
              <span className="font-medium">{weekCount}</span> programadas para esta semana
            </p>
            <div className="rounded-lg bg-white/60 p-3">
              <p className="text-sm font-medium text-black">Hoy</p>
              <p className="mt-1 text-sm text-black/70">
                Tienes <span className="font-medium">{today.length}</span> contenidos programados
              </p>
            </div>
          </div>
        </div>
      </div>

      <SummaryStrip yesterday={yesterday} today={today} tomorrow={tomorrow} onViewMore={() => handleNavigation("/calendario")} />
    </div>
  )

  if (ideaPlanEnabled) {
    return <section>{mainContent}</section>
  }

  return (
    <LegacyDashboard
      isTransitioning={isTransitioning}
      isMobileMenuOpen={isMobileMenuOpen}
      setIsMobileMenuOpen={setIsMobileMenuOpen}
      handleNavigation={handleNavigation}
      mainContent={mainContent}
    />
  )
}

function LegacyDashboard({
  isTransitioning,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  handleNavigation,
  mainContent,
}: {
  isTransitioning: boolean
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (value: boolean) => void
  handleNavigation: (path: string) => void
  mainContent: React.ReactNode
}) {
  return (
    <div className={`min-h-screen bg-[var(--surface)] ${isTransitioning ? "notebook-exit" : "notebook-enter"}`}>
      <div className="hidden lg:block">
        <SidebarNotebook activeRoute="/dashboard" onNavigate={handleNavigation} />
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-[#0E0E0E]">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <Image src="/brand/logo-full.svg" alt="IREAL" width={120} height={30} priority />
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-white/70 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarNotebook
              activeRoute="/dashboard"
              onNavigate={(path) => {
                setIsMobileMenuOpen(false)
                handleNavigation(path)
              }}
            />
          </div>
        </div>
      )}

      <TopbarMobile onMenu={() => setIsMobileMenuOpen(true)} onSettings={() => handleNavigation("/configuracion")} />

      <main className="lg:ml-72 min-h-screen" role="main">
        {mainContent}
      </main>
    </div>
  )
}

function SidebarNotebook({ activeRoute, onNavigate }: { activeRoute: string; onNavigate: (path: string) => void }) {
  const supabase = createClient()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Feather, label: "Ideas", path: "/ideas" },
    { icon: FileText, label: "Planes", path: "/planes" },
    { icon: CalendarCheck2, label: "Calendario", path: "/calendario" },
    { icon: Library, label: "Biblioteca", path: "/biblioteca" },
    { icon: BarChart3, label: "Analytics", path: "/analytics" },
  ]

  return (
    <nav className="fixed left-0 top-0 z-30 flex h-screen w-72 flex-col bg-[#0E0E0E] text-white" role="navigation">
      <div className="border-b border-white/10 p-6">
        <Image src="/brand/logo-full.svg" alt="IREAL" width={128} height={32} priority />
      </div>

      <div className="flex-1 py-6">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeRoute === item.path
          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`relative flex w-full items-center gap-3 px-6 py-3 text-left transition-colors ${
                isActive ? "text-white" : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/20" />}
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>

      <div className="space-y-2 border-t border-white/10 p-6 text-sm text-white/60">
        <button
          onClick={() => onNavigate("/configuracion")}
          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-white/70 transition-colors hover:text-white hover:bg-white/5"
        >
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5" />
            <span>Configuración</span>
          </div>
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-white/70 transition-colors hover:text-white hover:bg-white/5"
        >
          <div className="flex items-center gap-3">
            <LogOut className="h-5 w-5" />
            <span>Salir</span>
          </div>
        </button>
      </div>
    </nav>
  )
}

function TopbarMobile({ onMenu, onSettings }: { onMenu: () => void; onSettings: () => void }) {
  return (
    <div className="sticky top-0 z-20 flex items-center justify-between border-b border-black/10 bg-white/95 px-4 py-3 lg:hidden">
      <button
        onClick={onMenu}
        className="rounded-md p-2 text-black/70 hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>
      <Image src="/brand/logo-full.svg" alt="IREAL" width={110} height={28} priority />
      <button
        onClick={onSettings}
        className="rounded-md p-2 text-black/70 hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
        aria-label="Configuración"
      >
        <Settings className="h-5 w-5" />
      </button>
    </div>
  )
}

function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle: string
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-sm text-black/60">{subtitle}</p>
        <h1 className="text-3xl font-medium text-black">{title}</h1>
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

function CardList({ icon: Icon, title, items, onViewAll, emptyState, type }: CardListProps) {
  return (
    <div className="rounded-xl border border-[#E5E5E5] bg-white/40 p-5 hover:shadow-sm transition-shadow">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-black/60" aria-hidden="true" />
          <h3 className="font-medium text-black">{title}</h3>
        </div>
        <button onClick={onViewAll} className="text-sm text-black/60 hover:text-black transition-colors">
          Ver todo
        </button>
      </div>

      {items.length > 0 ? (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onViewAll()}
                className="w-full rounded-lg border border-transparent bg-white/60 px-3 py-2 text-left transition hover:border-[var(--accent-600)]/40 hover:bg-white"
              >
                <p className="font-medium text-black">{item.title}</p>
                <p className="text-sm text-black/60">{item.meta}</p>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-lg bg-white/50 p-4 text-sm text-black/70">
          <p>{emptyState.message}</p>
          <button onClick={emptyState.onCta} className="mt-2 text-[var(--accent-600)] hover:underline">
            {emptyState.cta}
          </button>
        </div>
      )}
    </div>
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
    <div className="mt-10 rounded-2xl border border-[#E5E5E5] bg-white/30 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-black">Resumen rápido</h3>
          <p className="text-sm text-black/60">Lo esencial de tu calendario mágico.</p>
        </div>
        <button onClick={onViewMore} className="text-sm text-[var(--accent-600)] hover:underline">
          Ver calendario
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {sections.map((section) => (
          <div key={section.label} className="rounded-xl border border-white/50 bg-white/70 p-4">
            <h4 className="text-sm font-semibold text-black">{section.label}</h4>
            <ul className="mt-3 space-y-2">
              {section.items.map((item) => (
                <li key={`${section.label}-${item.title}`} className="text-sm text-black/70">
                  {item.title} · <span className="capitalize">{item.status}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}







