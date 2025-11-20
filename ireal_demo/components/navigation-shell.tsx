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
      return (
        <button
          key={item.path}
          onClick={() => {
            router.push(item.path)
            onNavigate?.()
          }}
          className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors rounded-lg ${
            isActive
              ? "bg-white text-[#1e130b]"
              : "text-[#5c4a3d] hover:text-[#1e130b] hover:bg-[#f9efe0]"
          } ${isCollapsed ? "justify-center px-0" : ""}`}
          aria-current={isActive ? "page" : undefined}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          {!isCollapsed && <span className="font-medium">{item.label}</span>}
        </button>
      )
    })

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <div
        className={`hidden lg:flex fixed left-0 top-0 bottom-0 flex-col border-r ${
          collapsed ? "w-20" : "w-72"
        }`}
        style={{ borderColor: BORDER, backgroundColor: SOFT_BG, color: ACCENT_TEXT }}
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
              width={collapsed ? 48 : 136}
              height={collapsed ? 24 : 32}
              priority
            />
          </Link>
          <button
            onClick={() => setCollapsed((prev) => !prev)}
            className="rounded-md border p-2 transition-colors hover:bg-[#f9efe0]"
            style={{ borderColor: BORDER, color: MUTED_TEXT }}
            aria-label={collapsed ? "Expandir menu" : "Colapsar menu"}
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 px-4 space-y-1 text-sm" style={{ color: MUTED_TEXT }}>
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

      <div className={`min-h-screen ${collapsed ? "lg:ml-20" : "lg:ml-72"}`}>
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

