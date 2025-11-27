"use client"

import { useEffect, useState } from "react"
import { Loader2, Search } from "lucide-react"

type NoteOption = {
  id: string
  title: string
  content?: string
}

interface NotesSelectorProps {
  open: boolean
  onClose: () => void
  onSelect: (notes: NoteOption[]) => void
}

export function NotesSelector({ open, onClose, onSelect }: NotesSelectorProps) {
  const [options, setOptions] = useState<NoteOption[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!open) return
    const timeout = setTimeout(() => {
      void fetchNotes(search)
    }, 200)
    return () => clearTimeout(timeout)
  }, [open, search])

  const fetchNotes = async (query: string) => {
    try {
      setLoading(true)
      const url = query ? `/api/ideas?search=${encodeURIComponent(query)}` : "/api/ideas"
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Failed to load notes (${res.status})`)
      const data = (await res.json()) as NoteOption[]
      setOptions(data ?? [])
    } catch (err) {
      console.error("[notes-selector] error loading notes", err)
      setOptions([])
    } finally {
      setLoading(false)
    }
  }

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleConfirm = () => {
    const chosen = options.filter((o) => selectedIds.has(o.id))
    onSelect(chosen)
    setSelectedIds(new Set())
    setSearch("")
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl border border-[#E5E5E5]">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#E5E5E5]">
          <div>
            <h3 className="text-lg font-semibold text-black">Seleccionar notas</h3>
            <p className="text-sm text-black/60">Busca y selecciona notas para vincular al plan.</p>
          </div>
          <button onClick={onClose} className="text-sm text-black/60 hover:text-black">
            Cerrar
          </button>
        </div>

        <div className="p-5 space-y-4">
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

          <div className="rounded-lg border border-[#E5E5E5] bg-white/50 max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-black/60">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Cargando notas...
              </div>
            ) : options.length === 0 ? (
              <div className="py-8 text-center text-sm text-black/50">No hay notas para mostrar.</div>
            ) : (
              <ul className="divide-y divide-[#E5E5E5]">
                {options.map((note) => {
                  const checked = selectedIds.has(note.id)
                  return (
                    <li key={note.id}>
                      <label className="flex items-start gap-3 p-3 hover:bg-black/5 cursor-pointer">
                        <input type="checkbox" className="mt-1" checked={checked} onChange={() => toggle(note.id)} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-black">{note.title || "Nota sin título"}</p>
                          {note.content && (
                            <p className="text-xs text-black/60 line-clamp-2 whitespace-pre-line">{note.content}</p>
                          )}
                        </div>
                      </label>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-black bg-white/40 border border-[#E5E5E5] rounded-lg hover:bg-white/60 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 text-sm text-white bg-[var(--accent-600)] rounded-lg hover:bg-[var(--accent-700)] transition-colors"
            >
              Añadir seleccionadas
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
