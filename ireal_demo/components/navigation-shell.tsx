"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Feather,
  FileText,
  CalendarCheck2,
  Library,
  BarChart3,
  Settings,
  Menu,
  X,
  ArrowLeft,
} from "lucide-react"
import { useNavigationState } from "@/hooks/useNavigationState"

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Feather, label: "Ideas", path: "/ideas" },
  { icon: FileText, label: "Planes", path: "/planes" },
  { icon: CalendarCheck2, label: "Calendario", path: "/calendario" },
  { icon: Library, label: "Biblioteca", path: "/biblioteca" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
]

const SOFT_BG = "#fdf5eb"
const ACCENT_TEXT = "#1e130b"
const MUTED_TEXT = "#5c4a3d"
const BORDER = "#e7d9c6"

export function NavigationShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { goBack, history, enabled } = useNavigationState()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [collapsedHover, setCollapsedHover] = useState(false)

  useEffect(() => {
    if (enabled) {
      console.info("[NavigationShell] IDEA_PLAN_STABILITY flag enabled. Route:", pathname)
    } else {
      console.info("[NavigationShell] IDEA_PLAN_STABILITY flag disabled. Rendering legacy layout.")
    }
  }, [enabled, pathname])

  const renderMenuItems = (onNavigate?: () => void, isCollapsed?: boolean) =>
    navItems.map((item) => {
      const Icon = item.icon
      const isActive = pathname === item.path
      const collapsedClasses = isCollapsed
        ? "justify-center w-12 h-12 rounded-md px-0 py-0"
        : "w-full gap-3 px-4 py-3 rounded-lg"
      return (
        <button
          key={item.path}
          onClick={() => {
            router.push(item.path)
            onNavigate?.()
          }}
          className={`flex items-center ${collapsedClasses} text-left transition-all ${
            isActive
              ? "bg-white text-[#1e130b] shadow-[0_2px_0_rgba(0,0,0,0.08)]"
              : "text-[#5c4a3d] hover:text-[#1e130b] hover:bg-[#f9efe0]"
          }`}
          aria-current={isActive ? "page" : undefined}
        >
          <Icon className={isCollapsed ? "h-5 w-5" : "h-4 w-4"} aria-hidden="true" />
          {!isCollapsed && <span className="font-medium tracking-tight">{item.label}</span>}
        </button>
      )
    })

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <div
        className={`hidden lg:flex fixed left-0 top-0 bottom-0 flex-col border-r ${
          collapsed ? "w-16" : "w-72"
        }`}
        style={{ borderColor: BORDER, backgroundColor: SOFT_BG, color: ACCENT_TEXT, boxShadow: "4px 0 0 #00000010" }}
      >
        <div className="flex items-center justify-between gap-2 px-4 py-5">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 focus:outline-none focus-visible:ring-2 ${
              collapsed ? "justify-center w-full" : ""
            }`}
            style={{ color: ACCENT_TEXT, borderColor: BORDER }}
          >
            <Image
              src="/brand/logo-full.svg"
              alt="IREAL"
              width={collapsed ? 36 : 136}
              height={collapsed ? 18 : 32}
              priority
            />
          </Link>
          <button
            onClick={() => setCollapsed((prev) => !prev)}
            onMouseEnter={() => setCollapsedHover(true)}
            onMouseLeave={() => setCollapsedHover(false)}
            className="rounded-md border transition-colors hover:bg-[#f9efe0] flex items-center justify-center"
            style={{ borderColor: BORDER, color: MUTED_TEXT, width: 40, height: 40 }}
            aria-label={collapsed ? "Expandir menu" : "Colapsar menu"}
          >
            <span className="flex items-center justify-center w-6 h-6">
              {collapsed ? (
                collapsedHover ? (
                  <Menu className="h-5 w-5" />
                ) : (
                  <Image src="/logos/Sombrero2.png" alt="Menu" width={22} height={18} className="object-contain" />
                )
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </span>
          </button>
        </div>

        <div
          className={`flex-1 ${collapsed ? "px-2 items-center" : "px-4"} space-y-1 text-sm flex flex-col`}
          style={{ color: MUTED_TEXT }}
        >
          {renderMenuItems(undefined, collapsed)}
        </div>

        <div className="px-6 py-5 border-t text-sm" style={{ borderColor: BORDER, color: MUTED_TEXT }}>
          <button
            onClick={() => router.push("/configuracion")}
            className={`flex items-center gap-2 hover:text-[#1e130b] transition-colors ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <Settings className="h-4 w-4" />
            {!collapsed && "Configuracion"}
          </button>
        </div>
      </div>

      <div
        className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 backdrop-blur"
        style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: `${SOFT_BG}E6` }}
      >
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="rounded-md p-2 focus:outline-none focus-visible:ring-2"
          style={{ color: MUTED_TEXT, backgroundColor: "transparent", borderColor: BORDER }}
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Image src="/brand/logo-full.svg" alt="IREAL" width={120} height={30} priority />
        <button
          onClick={() => router.push("/configuracion")}
          className="rounded-md p-2 focus:outline-none focus-visible:ring-2"
          style={{ color: MUTED_TEXT, backgroundColor: "transparent", borderColor: BORDER }}
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 p-6 space-y-6" style={{ backgroundColor: SOFT_BG }}>
            <div className="flex items-center justify-between">
              <Image src="/brand/logo-full.svg" alt="IREAL" width={120} height={30} priority />
              <button onClick={() => setMobileMenuOpen(false)} className="p-2" style={{ color: MUTED_TEXT }}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2 text-sm" style={{ color: MUTED_TEXT }}>
              {renderMenuItems(() => setMobileMenuOpen(false))}
            </div>
          </div>
        </div>
      )}

        <div className={`min-h-screen ${collapsed ? "lg:ml-16" : "lg:ml-72"}`}>
        <header
          className="flex items-center justify-between px-6 py-4 text-sm"
          style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: SOFT_BG, color: MUTED_TEXT }}
        >
          <div className="flex items-center gap-3">
            {history.length >= 2 && enabled ? (
              <button
                onClick={goBack}
                className="rounded-lg border px-2 py-1"
                style={{ borderColor: BORDER, color: MUTED_TEXT }}
                aria-label="Regresar"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <div className="text-xs uppercase tracking-wide" style={{ color: "#c4aa89" }}>
            {pathname}
          </div>
        </header>
        <main className="min-h-screen bg-[var(--surface)]">{children}</main>
      </div>
    </div>
  )
}

