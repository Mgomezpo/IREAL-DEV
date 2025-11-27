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
    description: "",
    channels: [] as string[],
    pasion: "",
    motivacion: "",
    conexion: "",
    vision: "",
    tiempo: "",
    temas: "",
  })
  const [selectedNotes, setSelectedNotes] = useState<IdeaRecord[]>([])
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [aiDoc, setAiDoc] = useState<any | null>(null)
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
      console.error("[new-plan] Error creating plan", err)
      setError("No pudimos crear el plan. Intenta de nuevo.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    setAiDoc(null)
    try {
      const response = await fetch("/api/ai/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.name,
          pasion: formData.pasion,
          motivacion: formData.motivacion,
          conexion: formData.conexion,
          vision: formData.vision,
          tiempo: formData.tiempo,
          temas: formData.temas
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          contextNotes: selectedNotes.map((n) => [n.title, n.content].filter(Boolean).join(" - ")).filter(Boolean),
        }),
      })

      if (!response.ok) {
        throw new Error(`Error al generar plan (${response.status})`)
      }

      const payload = await response.json()
      setAiDoc(payload.data ?? payload)
    } catch (err) {
      console.error("[new-plan] Error generating plan", err)
      setError("No pudimos generar el plan. Intenta de nuevo.")
    } finally {
      setGenerating(false)
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

            <div className="rounded-xl border border-[#E5E5E5] bg-white/70 p-6 space-y-3">
              <h3 className="font-semibold text-black text-sm">Resultado IA (opcional)</h3>
              {generating ? (
                <div className="flex items-center gap-2 text-sm text-black/60">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generando plan...
                </div>
              ) : aiDoc ? (
                <div className="space-y-3 text-sm text-black/70 whitespace-pre-wrap">
                  <p className="font-semibold text-black">Diagnóstico</p>
                  <p>{aiDoc.diagnosis || "—"}</p>
                  <p className="font-semibold text-black">Estrategia</p>
                  <p>{aiDoc.strategy || "—"}</p>
                  <p className="font-semibold text-black">Plan de ejecución</p>
                  <p>{aiDoc.executionPlan || "—"}</p>
                </div>
              ) : (
                <p className="text-sm text-black/50">Genera un plan para ver el resultado aquí.</p>
              )}
              <button
                type="button"
                onClick={() => void handleGenerate()}
                disabled={generating}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-white bg-[var(--accent-600)] hover:bg-[var(--accent-700)] transition-colors disabled:opacity-50"
              >
                {generating && <Loader2 className="h-4 w-4 animate-spin" />}
                Generar Plan con IA
              </button>
            </div>
          </div>

          <div className="lg:col-span-7">
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

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Pasión</label>
                    <input
                      type="text"
                      value={formData.pasion}
                      onChange={(e) => setFormData((prev) => ({ ...prev, pasion: e.target.value }))}
                      className="w-full bg-white/60 border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-lg px-3 py-2 text-sm transition-colors"
                      placeholder="Ej. Marketing, fitness"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Motivación</label>
                    <input
                      type="text"
                      value={formData.motivacion}
                      onChange={(e) => setFormData((prev) => ({ ...prev, motivacion: e.target.value }))}
                      className="w-full bg-white/60 border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-lg px-3 py-2 text-sm transition-colors"
                      placeholder="¿Qué te mueve a crear?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Conexión</label>
                    <input
                      type="text"
                      value={formData.conexion}
                      onChange={(e) => setFormData((prev) => ({ ...prev, conexion: e.target.value }))}
                      className="w-full bg-white/60 border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-lg px-3 py-2 text-sm transition-colors"
                      placeholder="¿Cómo conectas con tu audiencia?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Visión</label>
                    <input
                      type="text"
                      value={formData.vision}
                      onChange={(e) => setFormData((prev) => ({ ...prev, vision: e.target.value }))}
                      className="w-full bg-white/60 border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-lg px-3 py-2 text-sm transition-colors"
                      placeholder="¿A dónde quieres llegar?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Tiempo disponible</label>
                    <input
                      type="text"
                      value={formData.tiempo}
                      onChange={(e) => setFormData((prev) => ({ ...prev, tiempo: e.target.value }))}
                      className="w-full bg-white/60 border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-lg px-3 py-2 text-sm transition-colors"
                      placeholder="Ej. 5 horas/semana"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Temas (separados por coma)</label>
                    <input
                      type="text"
                      value={formData.temas}
                      onChange={(e) => setFormData((prev) => ({ ...prev, temas: e.target.value }))}
                      className="w-full bg-white/60 border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-lg px-3 py-2 text-sm transition-colors"
                      placeholder="Tema 1, Tema 2"
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
                  Guardar plan
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
