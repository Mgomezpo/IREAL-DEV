"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Loader2, Plus } from "lucide-react"
import { NotesSelector } from "@/components/ui/notes-selector"

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
    accountName: "",
    description: "",
    channels: [] as string[],
    pasion: "",
    motivacion: "",
    audiencia: "",
    vision: "",
    tiempo: "",
    temas: "",
  })
  const [selectedNotes, setSelectedNotes] = useState<IdeaRecord[]>([])
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadLinkedNote = async () => {
      if (!linkedIdeaId) return
      try {
        const res = await fetch(`/api/ideas/${linkedIdeaId}`)
        if (!res.ok) return
        const note = (await res.json()) as IdeaRecord
        setSelectedNotes((prev) => {
          if (prev.find((n) => n.id === note.id)) return prev
          return [...prev, note]
        })
      } catch (err) {
        console.error("[new-plan] Error preloading linked note", err)
      }
    }
    void loadLinkedNote()
  }, [linkedIdeaId])

  const handleNotesSelected = (notes: IdeaRecord[]) => {
    setSelectedNotes((prev) => {
      const merged = [...prev]
      notes.forEach((n) => {
        if (!merged.find((m) => m.id === n.id)) merged.push(n)
      })
      return merged
    })
  }

  const removeNote = (id: string) => {
    setSelectedNotes((prev) => prev.filter((n) => n.id !== id))
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
      // 1) Generar plan con IA usando notas vinculadas como contexto
      const aiResponse = await fetch("/api/ai/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.accountName || formData.name,
          pasion: formData.pasion,
          motivacion: formData.motivacion,
          conexion: formData.audiencia,
          vision: formData.vision,
          tiempo: formData.tiempo,
          temas: formData.temas
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          contextNotes: selectedNotes.map((n) => [n.title, n.content].filter(Boolean).join(" - ")).filter(Boolean),
        }),
      })

      if (!aiResponse.ok) {
        throw new Error(`Error al generar plan (${aiResponse.status})`)
      }

      // 2) Persistir plan con las notas vinculadas
      const response = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          channels: formData.channels,
          status: "draft",
          initialIdeaIds: selectedNotes.map((n) => n.id),
        }),
      })

      if (!response.ok) {
        throw new Error(`Error al crear plan (${response.status})`)
      }

      const plan = await response.json()
      router.push(`/planes/${plan.id}`)
    } catch (err) {
      console.error("[new-plan] Error generating/saving plan", err)
      setError("No pudimos generar y guardar el plan. Intenta de nuevo.")
    } finally {
      setSubmitting(false)
    }
  }

  const selectedCount = selectedNotes.length

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

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-xl border border-[#E5E5E5] bg-white/70 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg font-semibold text-black">Contexto (Notas)</h2>
                  <p className="text-sm text-black/60">Vincula notas para que la IA respete tus ideas.</p>
                </div>
                <span className="text-xs text-black/60 bg-black/5 px-3 py-1 rounded-full">
                  {selectedCount} seleccionada{selectedCount === 1 ? "" : "s"}
                </span>
              </div>

              {selectedNotes.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#E5E5E5] bg-white/40 p-4 text-sm text-black/50">
                  Aún no hay notas seleccionadas.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedNotes.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-lg border border-[#E5E5E5] bg-white/60 px-3 py-2 flex items-start justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-black">{note.title || "Nota sin título"}</p>
                        {note.content && (
                          <p className="text-xs text-black/60 line-clamp-2 whitespace-pre-line">{note.content}</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeNote(note.id)}
                        className="text-xs text-[var(--accent-700)] hover:underline"
                        aria-label="Quitar nota"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => setSelectorOpen(true)}
                className="inline-flex items-center gap-2 text-sm text-[var(--accent-700)] hover:underline"
              >
                <Plus className="h-4 w-4" />
                Agregar más notas
              </button>
            </div>
          </div>

          <div className="lg:col-span-7">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="rounded-xl border border-[#E5E5E5] bg-white/70 p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-black mb-2">Nombre del plan *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-white/60 border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-lg px-3 py-2 text-sm transition-colors"
                      placeholder="Ej: Campaña Q1"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-black mb-2">Nombre de la cuenta / creador</label>
                    <input
                      type="text"
                      value={formData.accountName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, accountName: e.target.value }))}
                      className="w-full bg-white/60 border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-lg px-3 py-2 text-sm transition-colors"
                      placeholder="Ej: Miguel / @ireal"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">¿Qué más te gusta hacer / hablar?</label>
                    <input
                      type="text"
                      value={formData.pasion}
                      onChange={(e) => setFormData((prev) => ({ ...prev, pasion: e.target.value }))}
                      className="w-full bg-white/60 border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-lg px-3 py-2 text-sm transition-colors"
                      placeholder="Temas que amas"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">¿Por qué quieres crear contenido?</label>
                    <input
                      type="text"
                      value={formData.motivacion}
                      onChange={(e) => setFormData((prev) => ({ ...prev, motivacion: e.target.value }))}
                      className="w-full bg-white/60 border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-lg px-3 py-2 text-sm transition-colors"
                      placeholder="Motivación/sueño"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-black mb-2">
                      Describe a la persona con la que quieres conectar
                    </label>
                    <input
                      type="text"
                      value={formData.audiencia}
                      onChange={(e) => setFormData((prev) => ({ ...prev, audiencia: e.target.value }))}
                      className="w-full bg-white/60 border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-lg px-3 py-2 text-sm transition-colors"
                      placeholder="Su perfil, intereses, qué le importa"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-black mb-2">
                      Temas/historias que necesitas compartir
                    </label>
                    <input
                      type="text"
                      value={formData.temas}
                      onChange={(e) => setFormData((prev) => ({ ...prev, temas: e.target.value }))}
                      className="w-full bg-white/60 border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-lg px-3 py-2 text-sm transition-colors"
                      placeholder="Lista de temas clave"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-black mb-2">Visión a 6 meses (éxito)</label>
                    <input
                      type="text"
                      value={formData.vision}
                      onChange={(e) => setFormData((prev) => ({ ...prev, vision: e.target.value }))}
                      className="w-full bg-white/60 border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-lg px-3 py-2 text-sm transition-colors"
                      placeholder="¿Qué estaría pasando?"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-black mb-2">Tiempo semanal disponible</label>
                    <input
                      type="text"
                      value={formData.tiempo}
                      onChange={(e) => setFormData((prev) => ({ ...prev, tiempo: e.target.value }))}
                      className="w-full bg-white/60 border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-lg px-3 py-2 text-sm transition-colors"
                      placeholder="Ej: 5 horas/semana"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{error}</div>
              )}

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
                  Crear plan con IA
                </button>
              </div>
            </form>
          </div>
        </div>

        <NotesSelector
          open={selectorOpen}
          onClose={() => setSelectorOpen(false)}
          onSelect={(notes) => {
            handleNotesSelected(notes)
            setSelectorOpen(false)
          }}
        />
      </div>
    </div>
  )
}
