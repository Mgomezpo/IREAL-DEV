"use client"

import { Suspense } from "react"
import { usePathname } from "next/navigation"
import { NavigationShell } from "@/components/navigation-shell"
import { NavigationStateProvider } from "@/hooks/useNavigationState"
import { isIdeaPlanStabilityEnabled } from "@/lib/feature-flags"

function NavigationRootInner({ children }: { children: React.ReactNode }) {
  const enabled = isIdeaPlanStabilityEnabled()
  const pathname = usePathname()
  const disableShellRoutes = ["/", "/auth"]
  const currentPath = pathname ?? ""
  const isShellDisabled = disableShellRoutes.some((route) => currentPath === route || currentPath.startsWith(`${route}/`))
  const shouldUseShell = enabled && !isShellDisabled
  if (!shouldUseShell) {
    return <>{children}</>
  }
  return (
    <NavigationStateProvider enabled={enabled}>
      <NavigationShell>{children}</NavigationShell>
    </NavigationStateProvider>
  )
}

export function NavigationRoot({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--surface)] text-[var(--ink)] flex items-center justify-center">
          <span className="text-sm text-black/60">Cargando...</span>
        </div>
      }
    >
      <NavigationRootInner>{children}</NavigationRootInner>
    </Suspense>
  )
}
