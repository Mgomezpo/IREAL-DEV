"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Loader2, Plus, Search } from "lucide-react"

type IdeaRecord = {
  id: string
  title: string
  content?: string
}

export default function NewPlanPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const linkedIdeaId = searchParams.get("linkedIdeaId")

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    channels: [] as string[],
  })
  const [ideas, setIdeas] = useState<IdeaRecord[]>([])
  const [search, setSearch] = useState("")
  const [loadingIdeas, setLoadingIdeas] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (linkedIdeaId) {
      setSelectedIds((prev) => new Set(prev).add(linkedIdeaId))
    }
  }, [linkedIdeaId])

  const fetchIdeas = useCallback(
    async (query: string) => {
      try {
        setLoadingIdeas(true)
        const url = query ? `/api/ideas?search=${encodeURIComponent(query)}` : "/api/ideas"
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Failed to load ideas (${response.status})`)
        }
        const data = (await response.json()) as IdeaRecord[]
        setIdeas(data ?? [])
      } catch (err) {
        console.error("[new-plan] Error fetching ideas", err)
        setIdeas([])
      } finally {
        setLoadingIdeas(false)
      }
    },
    [setIdeas],
  )

  useEffect(() => {
    const timeout = setTimeout(() => {
      void fetchIdeas(search)
    }, 250)
    return () => clearTimeout(timeout)
  }, [search, fetchIdeas])

  const toggleIdea = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError("Agrega un nombre para el plan")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          channels: formData.channels,
          status: "draft",
          initialIdeaIds: Array.from(selectedIds),
        }),
      })

      if (!response.ok) {
        throw new Error(`Error al crear plan (${response.status})`)
      }

      const plan = await response.json()
      router.push(`/planes/${plan.id}`)
    } catch (err) {
      console.error("[new-plan] Error creating plan", err)
      setError("No pudimos crear el plan. Intenta de nuevo.")
    } finally {
      setSubmitting(false)
    }
  }

  const selectedCount = selectedIds.size
  const ideaOptions = useMemo(() => ideas, [ideas])

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/planes")}
            className="p-2 hover:bg-black/5 rounded-lg transition-colors"
            aria-label="Volver a planes"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-semibold font-display text-black">Crear plan</h1>
            <p className="text-black/60 text-sm">Vincula notas para darle contexto a la IA desde el inicio.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border border-[#E5E5E5] bg-white/70 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">Nombre del plan *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full bg-white/60 border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-lg px-3 py-2 text-sm transition-colors"
                placeholder="Ej. Estrategia Q1 / Campaña de lanzamientos"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">Descripción (opcional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full bg-white/60 border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-lg px-3 py-2 text-sm transition-colors"
                rows={3}
                placeholder="Breve resumen del plan"
              />
            </div>
          </div>

          <div className="rounded-xl border border-[#E5E5E5] bg-white/70 p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold text-black">Selector de Ideas</h2>
                <p className="text-sm text-black/60">
                  Vincula una o varias notas. Preseleccionamos la que venía en el link si aplica.
                </p>
              </div>
              <span className="text-xs text-black/60 bg-black/5 px-3 py-1 rounded-full">
                {selectedCount} seleccionada{selectedCount === 1 ? "" : "s"}
              </span>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar notas por título o contenido"
                className="w-full rounded-lg border border-black/10 bg-white/70 py-2.5 pl-9 pr-4 text-sm text-black placeholder:text-black/40 focus:border-black focus:outline-none focus:ring-0"
              />
            </div>

            <div className="rounded-lg border border-[#E5E5E5] bg-white/50 max-h-72 overflow-y-auto">
              {loadingIdeas ? (
                <div className="flex items-center justify-center py-8 text-black/60">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Cargando ideas...
                </div>
              ) : ideaOptions.length === 0 ? (
                <div className="py-8 text-center text-sm text-black/50">No hay ideas para mostrar.</div>
              ) : (
                <ul className="divide-y divide-[#E5E5E5]">
                  {ideaOptions.map((idea) => {
                    const checked = selectedIds.has(idea.id)
                    return (
                      <li key={idea.id}>
                        <label className="flex items-start gap-3 p-3 hover:bg-black/5 cursor-pointer">
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={checked}
                            onChange={() => toggleIdea(idea.id)}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-black">{idea.title || "Idea sin título"}</p>
                            {idea.content && (
                              <p className="text-xs text-black/60 line-clamp-2 whitespace-pre-line">{idea.content}</p>
                            )}
                          </div>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>

          {error && <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{error}</div>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/planes")}
              className="flex-1 px-4 py-2 text-sm text-black bg-white/40 border border-[#E5E5E5] rounded-lg hover:bg-white/60 transition-colors"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm text-white bg-[var(--accent-600)] rounded-lg hover:bg-[var(--accent-700)] transition-colors disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Crear plan
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
