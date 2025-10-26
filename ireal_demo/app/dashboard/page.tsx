"use client"

import type React from "react"
import { useState, useEffect } from "react"
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

// Mock data for demo
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
  todayCount: 3,
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

interface SidebarProps {
  activeRoute: string
  onNavigate: (path: string) => void
}

function SidebarNotebook({ activeRoute, onNavigate }: SidebarProps) {
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
    <nav className="w-72 bg-[#0E0E0E] text-white h-screen fixed left-0 top-0 z-30 flex flex-col" role="navigation">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
            <span className="font-display font-bold text-black text-lg">i</span>
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold">ireal</h2>
            <p className="text-white/60 text-sm">Cuaderno de contenidos</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 py-6">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeRoute === item.path

          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-white/5 transition-colors relative ${
                isActive ? "text-white" : "text-white/70"
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

      {/* Footer */}
      <div className="p-6 border-t border-white/10 space-y-2">
        {/* User Email */}
        <div className="px-3 py-2 text-white/60 text-sm">{/* Placeholder for user email */}</div>
        <button
          onClick={() => onNavigate("/configuracion")}
          className="w-full flex items-center justify-between text-white/70 hover:text-white hover:bg-white/5 px-3 py-2 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5" />
            <span>Configuración</span>
          </div>
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 text-white/70 hover:text-white hover:bg-white/5 px-3 py-2 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-3">
            <LogOut className="h-5 w-5" />
            <span>Cerrar sesión</span>
          </div>
        </button>
      </div>
    </nav>
  )
}

interface TopbarMobileProps {
  onMenu: () => void
  onSettings: () => void
}

function TopbarMobile({ onMenu, onSettings }: TopbarMobileProps) {
  return (
    <div className="sticky top-0 z-20 bg-[#FDF6EB]/95 backdrop-blur border-b border-[#E5E5E5] lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={onMenu} className="p-2 hover:bg-black/5 rounded-lg transition-colors" aria-label="Abrir menú">
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#0E0E0E] rounded flex items-center justify-center">
            <span className="font-display font-bold text-white text-xs">i</span>
          </div>
          <span className="font-display font-semibold">ireal</span>
        </div>

        <button
          onClick={onSettings}
          className="p-2 hover:bg-black/5 rounded-lg transition-colors"
          aria-label="Configuración"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

interface PageHeaderProps {
  title: string
  subtitle: string
  actions: React.ReactNode
}

function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl md:text-3xl tracking-tight font-semibold font-display text-black">{title}</h1>
        <p className="text-black/70 mt-1 text-sm md:text-base leading-7">{subtitle}</p>
      </div>
      <div className="flex gap-3">{actions}</div>
    </div>
  )
}

interface CardListProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  items: Array<{ id: string; title: string; meta?: string; href: string; status?: string; progress?: number }>
  onViewAll: () => void
  emptyState: { message: string; cta: string; onCta: () => void }
  type?: "ideas" | "plans" | "posts"
}

function CardList({ icon: Icon, title, items, onViewAll, emptyState, type = "ideas" }: CardListProps) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="rounded-xl border border-[#E5E5E5] bg-white/40 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-black/60" />
            <h3 className="font-medium text-black">{title}</h3>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-black/5 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#E5E5E5] bg-white/40 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-black/60" aria-hidden="true" />
          <h3 className="font-medium text-black">{title}</h3>
        </div>
        <button onClick={onViewAll} className="text-sm text-black/60 hover:text-black transition-colors">
          Ver todo
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-black/60 mb-3">{emptyState.message}</p>
          <button
            onClick={emptyState.onCta}
            className="text-sm text-[var(--accent-600)] hover:text-[var(--accent-700)] font-medium"
          >
            {emptyState.cta}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.slice(0, 3).map((item) => (
            <button
              key={item.id}
              onClick={() => (window.location.href = item.href)}
              className="w-full text-left p-3 rounded-lg hover:bg-white/60 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm text-black/80 font-medium group-hover:text-black">{item.title}</h4>
                  {item.meta && <p className="text-xs text-black/60 mt-1">{item.meta}</p>}
                  {type === "plans" && item.status && (
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          item.status === "Activo"
                            ? "bg-[var(--success)]/10 text-[var(--success)]"
                            : "bg-black/10 text-black/60"
                        }`}
                      >
                        {item.status}
                      </span>
                      {item.progress && (
                        <div className="flex-1 max-w-20">
                          <div className="h-2 bg-black/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[var(--accent-300)] rounded-full transition-all"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface SummaryStripProps {
  yesterday: Array<{ title: string; status: string }>
  today: Array<{ title: string; status: string }>
  tomorrow: Array<{ title: string; status: string }>
  onViewMore: () => void
}

function SummaryStrip({ yesterday, today, tomorrow, onViewMore }: SummaryStripProps) {
  const sections = [
    { title: "Ayer", items: yesterday },
    { title: "Hoy", items: today },
    { title: "Mañana", items: tomorrow },
  ]

  return (
    <div className="rounded-xl border border-[#E5E5E5] bg-white/40 p-6 mt-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-xl font-semibold text-black">Resumen</h3>
        <button onClick={onViewMore} className="text-sm text-black/60 hover:text-black transition-colors">
          Ver más
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {sections.map((section) => (
          <div key={section.title}>
            <h4 className="font-medium text-black mb-3">{section.title}</h4>
            <div className="space-y-2">
              {section.items.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-black/70 flex-1">{item.title}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      item.status === "publicado"
                        ? "bg-[var(--success)]/10 text-[var(--success)]"
                        : "bg-[var(--accent-300)]/10 text-[var(--accent-600)]"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
              {section.items.length === 0 && <p className="text-sm text-black/40">Sin actividad</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [ideas, setIdeas] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [pieces, setPieces] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        console.log("[v0] No authenticated user, redirecting to /auth")
        router.push("/auth")
        return
      }

      console.log("[v0] User authenticated:", user.email)
      setUser(user)

      // Load ideas
      const { data: ideasData } = await supabase
        .from("ideas")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3)

      // Load plans
      const { data: plansData } = await supabase
        .from("plans")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3)

      // Load pieces for calendar summary
      const { data: piecesData } = await supabase
        .from("pieces")
        .select("*")
        .order("scheduled_date", { ascending: true })

      setIdeas(ideasData || [])
      setPlans(plansData || [])
      setPieces(piecesData || [])
      setIsLoading(false)
    }

    loadData()
  }, [router])

  const handleNavigation = (path: string) => {
    setIsTransitioning(true)
    setTimeout(() => {
      router.push(path)
    }, 350)
  }

  const handleNewIdea = () => {
    console.log("[v0] cta_new_idea_click")
    handleNavigation("/ideas/new")
  }

  const formattedIdeas = ideas.map((idea) => ({
    id: idea.id,
    title: idea.title || "Sin título",
    meta: new Date(idea.created_at).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    }),
    href: `/ideas/${idea.id}`,
  }))

  const formattedPlans = plans.map((plan) => ({
    id: plan.id,
    title: plan.title,
    status: "Activo",
    progress: 50, // TODO: Calculate real progress
    href: `/planes/${plan.id}`,
  }))

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const yesterdayPieces = pieces
    .filter((p) => {
      const date = new Date(p.scheduled_date)
      date.setHours(0, 0, 0, 0)
      return date.getTime() === yesterday.getTime()
    })
    .map((p) => ({ title: p.title, status: p.status === "published" ? "publicado" : "programado" }))

  const todayPieces = pieces
    .filter((p) => {
      const date = new Date(p.scheduled_date)
      date.setHours(0, 0, 0, 0)
      return date.getTime() === today.getTime()
    })
    .map((p) => ({ title: p.title, status: p.status === "published" ? "publicado" : "programado" }))

  const tomorrowPieces = pieces
    .filter((p) => {
      const date = new Date(p.scheduled_date)
      date.setHours(0, 0, 0, 0)
      return date.getTime() === tomorrow.getTime()
    })
    .map((p) => ({ title: p.title, status: "programado" }))

  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)

  const weekCount = pieces.filter((p) => {
    const date = new Date(p.scheduled_date)
    return date >= weekStart && date < weekEnd
  }).length

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--accent-300)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-black/60">Cargando tu cuaderno...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-[var(--surface)] ${isTransitioning ? "notebook-exit" : "notebook-enter"}`}>
      {/* Sidebar Desktop */}
      <div className="hidden lg:block">
        <SidebarNotebook activeRoute="/dashboard" onNavigate={handleNavigation} />
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-[#0E0E0E]">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <span className="font-display font-bold text-black">i</span>
                </div>
                <span className="font-display text-lg font-semibold text-white">ireal</span>
              </div>
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

      {/* Top bar Mobile */}
      <TopbarMobile onMenu={() => setIsMobileMenuOpen(true)} onSettings={() => handleNavigation("/configuracion")} />

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen" role="main">
        <div className="max-w-7xl mx-auto px-6 py-10">
          {/* Header */}
          <PageHeader
            title="Tu página de hoy"
            subtitle="Convierte tu idea en un hechizo de contenido."
            actions={
              <>
                <button
                  onClick={handleNewIdea}
                  className="group relative text-base text-black hover:text-white hover:bg-[var(--accent-600)] rounded-sm ring-1 ring-transparent hover:ring-[var(--accent-600)]/70 hover:shadow-[0_0_0_6px_rgba(138,15,28,0.10)] px-4 py-2 transition-all duration-200 font-medium"
                >
                  <Plus className="h-4 w-4 inline mr-2" />
                  Nueva idea
                </button>
              </>
            }
          />

          {/* Cards Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Ideas Card */}
            <CardList
              icon={Feather}
              title="Ideas"
              items={formattedIdeas}
              onViewAll={() => handleNavigation("/ideas")}
              emptyState={{
                message: "Aún no hay ideas. Empieza una ✨",
                cta: "Nueva idea",
                onCta: () => handleNavigation("/ideas/new"),
              }}
              type="ideas"
            />

            {/* Plans Card */}
            <CardList
              icon={FileText}
              title="Planes"
              items={formattedPlans}
              onViewAll={() => handleNavigation("/planes")}
              emptyState={{
                message: "Crea tu primer plan y el cuaderno cobrará vida ✨",
                cta: "Nuevo plan",
                onCta: () => handleNavigation("/planes/nuevo"),
              }}
              type="plans"
            />

            {/* Publications Card */}
            <div className="rounded-xl border border-[#E5E5E5] bg-white/40 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-4">
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
                <div className="p-3 bg-white/60 rounded-lg">
                  <p className="text-sm text-black font-medium">Hoy</p>
                  <p className="text-sm text-black/70 mt-1">
                    Tienes <span className="font-medium">{todayPieces.length}</span> contenidos programados
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Strip */}
          <SummaryStrip
            yesterday={yesterdayPieces}
            today={todayPieces}
            tomorrow={tomorrowPieces}
            onViewMore={() => handleNavigation("/calendario")}
          />
        </div>
      </main>
    </div>
  )
}
