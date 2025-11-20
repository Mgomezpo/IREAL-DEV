"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

type RouteSnapshot = {
  pathname: string
  search: string
  scrollY: number
  state?: Record<string, unknown>
  timestamp: number
}

type NavigationState = {
  history: RouteSnapshot[]
  goBack: () => void
  registerState: (state: Record<string, unknown>) => void
  currentState: Record<string, unknown> | undefined
  enabled: boolean
}

const STORAGE_KEY = "ireal:nav-history"

const NavigationStateContext = createContext<NavigationState | undefined>(undefined)

const readHistoryFromStorage = (): RouteSnapshot[] => {
  if (typeof window === "undefined") return []
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as RouteSnapshot[]) : []
  } catch {
    return []
  }
}

const writeHistoryToStorage = (history: RouteSnapshot[]) => {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch {
    /* no-op */
  }
}

const getStateKey = (pathname: string, search: string) => `${pathname}?${search}`

export function NavigationStateProvider({ children, enabled }: { children: ReactNode; enabled: boolean }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [history, setHistory] = useState<RouteSnapshot[]>(() => (enabled ? readHistoryFromStorage() : []))
  const stateMapRef = useRef<Record<string, Record<string, unknown>>>({})
  const [currentState, setCurrentState] = useState<Record<string, unknown> | undefined>(undefined)

  const persistHistory = useCallback(
    (next: RouteSnapshot[]) => {
      setHistory(next)
      writeHistoryToStorage(next)
    },
    [setHistory],
  )

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !pathname) {
      return
    }

    const handleScroll = () => {
      persistHistory((prev) => {
        if (!prev.length) return prev
        const updated = [...prev]
        updated[updated.length - 1] = {
          ...updated.at(-1)!,
          scrollY: window.scrollY,
        }
        return updated
      })
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [enabled, pathname, persistHistory])

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !pathname) return
    const search = searchParams?.toString() ?? ""
    const key = getStateKey(pathname, search)
    const snapshot: RouteSnapshot = {
      pathname,
      search,
      scrollY: window.scrollY,
      state: stateMapRef.current[key],
      timestamp: Date.now(),
    }

    persistHistory((prev) => {
      const filtered = prev.filter((item) => !(item.pathname === pathname && item.search === search))
      const next = [...filtered, snapshot]
      const trimmed = next.slice(-2)
      return trimmed
    })
    setCurrentState(stateMapRef.current[key])
  }, [enabled, pathname, searchParams, persistHistory])

  const goBack = useCallback(() => {
    if (!enabled || typeof window === "undefined") {
      router.back()
      return
    }
    if (history.length < 2) {
      router.back()
      return
    }
    const target = history[history.length - 2]
    const url = target.search ? `${target.pathname}?${target.search}` : target.pathname
    router.push(url)
    requestAnimationFrame(() => {
      window.scrollTo({ top: target.scrollY ?? 0, behavior: "auto" })
    })
  }, [enabled, history, router])

  const registerState = useCallback(
    (state: Record<string, unknown>) => {
      if (!enabled || typeof window === "undefined" || !pathname) return
      const search = searchParams?.toString() ?? ""
      const key = getStateKey(pathname, search)
      stateMapRef.current[key] = {
        ...(stateMapRef.current[key] ?? {}),
        ...state,
      }
      setCurrentState(stateMapRef.current[key])
    },
    [enabled, pathname, searchParams],
  )

  const value = useMemo<NavigationState>(
    () => ({
      history,
      goBack,
      registerState,
      currentState,
      enabled,
    }),
    [history, goBack, registerState, currentState, enabled],
  )

  return <NavigationStateContext.Provider value={value}>{children}</NavigationStateContext.Provider>
}

export function useNavigationState() {
  const ctx = useContext(NavigationStateContext)
  if (!ctx) {
    throw new Error("useNavigationState must be used within NavigationStateProvider")
  }
  return ctx
}
