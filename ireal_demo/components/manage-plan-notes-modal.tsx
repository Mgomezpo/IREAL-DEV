"use client"

import { useEffect, useMemo, useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Check, Loader2, Search, X } from "lucide-react"

type IdeaRecord = {
  id: string
  title: string
  content?: string | null
}

interface ManagePlanNotesModalProps {
  planId: string
  initialSelectedIds: string[]
  open: boolean
  onClose: () => void
  onSaved?: (ideas: IdeaRecord[]) => void
}

export function ManagePlanNotesModal({ planId, initialSelectedIds, open, onClose, onSaved }: ManagePlanNotesModalProps) {
  const [ideas, setIdeas] = useState<IdeaRecord[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds))
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setSelectedIds(new Set(initialSelectedIds))
      void fetchIdeas("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialSelectedIds.join("|")])

  const fetchIdeas = async (query: string) => {
    try {
      setLoading(true)
      setError(null)
      const url = query ? `/api/ideas?search=${encodeURIComponent(query)}` : "/api/ideas"
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to load ideas (${response.status})`)
      }
      const data = (await response.json()) as IdeaRecord[]
      setIdeas(data ?? [])
    } catch (err) {
      console.error("[plan-notes-modal] Error loading ideas", err)
      setError("No se pudieron cargar las notas.")
      setIdeas([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return
    const timeout = setTimeout(() => {
      void fetchIdeas(search)
    }, 250)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

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

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      const ideaIds = Array.from(selectedIds)
      const response = await fetch(`/api/plans/${planId}/ideas/attach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaIds }),
      })
      if (!response.ok) {
        throw new Error(`Failed to attach notes (${response.status})`)
      }

      const selectedIdeas = ideaIds
        .map((id) => ideas.find((idea) => idea.id === id))
        .filter(Boolean) as IdeaRecord[]

      onSaved?.(
        selectedIdeas.length === ideaIds.length
          ? selectedIdeas
          : ideaIds.map((id) => selectedIdeas.find((idea) => idea.id === id) ?? { id, title: `Idea ${id}` }),
      )
      onClose()
    } catch (err) {
      console.error("[plan-notes-modal] Error saving attachments", err)
      setError("No se pudieron guardar los vínculos. Intenta de nuevo.")
    } finally {
      setSaving(false)
    }
  }

  const selectedCount = selectedIds.size
  const ideaOptions = useMemo(() => ideas, [ideas])

  return (
    <Dialog.Root open={open} onOpenChange={(val) => (!val ? onClose() : null)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 z-40" />
        <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl border border-black/10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <Dialog.Title className="text-xl font-semibold text-black">Gestionar notas</Dialog.Title>
                <Dialog.Description className="text-sm text-black/60">
                  Selecciona las ideas que alimentarán este plan. Puedes agregar o quitar cuando quieras.
                </Dialog.Description>
              </div>
              <Dialog.Close className="rounded-full p-2 text-black/60 hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar notas..."
                  className="w-full rounded-lg border border-black/10 bg-white/70 py-2.5 pl-9 pr-4 text-sm text-black placeholder:text-black/40 focus:border-black focus:outline-none focus:ring-0"
                />
              </div>
              <span className="ml-3 text-xs text-black/60 bg-black/5 px-3 py-1 rounded-full">
                {selectedCount} seleccionada{selectedCount === 1 ? "" : "s"}
              </span>
            </div>

            <div className="rounded-lg border border-[#E5E5E5] bg-white/60 max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-10 text-black/60">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Cargando notas...
                </div>
              ) : ideaOptions.length === 0 ? (
                <div className="py-10 text-center text-sm text-black/50">No hay notas para mostrar.</div>
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
                          {checked && <Check className="h-4 w-4 text-[var(--accent-600)]" />}
                        </label>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {error && <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>}

            <div className="flex gap-3 mt-5">
              <button
                onClick={onClose}
                disabled={saving}
                className="flex-1 px-4 py-2 text-sm text-black bg-white/40 border border-[#E5E5E5] rounded-lg hover:bg-white/60 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleSave()}
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm text-white bg-[var(--accent-600)] rounded-lg hover:bg-[var(--accent-700)] transition-colors disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar vínculos
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
