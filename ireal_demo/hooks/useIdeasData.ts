"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

export interface IdeaRecord {
  id: string
  title: string
  content?: string
  created_at: string
  updated_at: string
  [key: string]: unknown
}

export interface IdeasStats {
  total: number
  today: number
  yesterday: number
  thisWeek: number
}

export function useIdeasData(search?: string) {
  const [ideas, setIdeas] = useState<IdeaRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState(0)

  const refresh = useCallback(() => setRefreshToken((token) => token + 1), [])

  useEffect(() => {
    let mounted = true
    const controller = new AbortController()
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const query = search ? `?search=${encodeURIComponent(search)}` : ""
        const response = await fetch(`/api/ideas${query}`, { signal: controller.signal })
        if (!response.ok) {
          throw new Error(`Failed to fetch ideas (${response.status})`)
        }
        const payload = (await response.json()) as IdeaRecord[]
        if (mounted) {
          const sorted = [...payload].sort(
            (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
          )
          setIdeas(sorted)
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return
        console.error("[ideas] Error loading ideas", err)
        if (mounted) {
          setError("No se pudieron cargar las ideas.")
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => {
      mounted = false
      controller.abort()
    }
  }, [search, refreshToken])

  const stats: IdeasStats = useMemo(() => {
    if (!ideas.length) {
      return { total: 0, today: 0, yesterday: 0, thisWeek: 0 }
    }
    const now = new Date()
    const todayKey = now.toDateString()
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    const yesterdayKey = yesterday.toDateString()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - 7)

    let todayCount = 0
    let yesterdayCount = 0
    let weekCount = 0

    for (const idea of ideas) {
      const created = new Date(idea.created_at || idea.updated_at)
      if (created.toDateString() === todayKey) todayCount++
      if (created.toDateString() === yesterdayKey) yesterdayCount++
      if (created >= startOfWeek) weekCount++
    }

    return {
      total: ideas.length,
      today: todayCount,
      yesterday: yesterdayCount,
      thisWeek: weekCount,
    }
  }, [ideas])

  return {
    ideas,
    loading,
    error,
    refresh,
    stats,
  }
}
