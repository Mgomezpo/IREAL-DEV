"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Trash2 } from "lucide-react"

type PlanSection = {
  id: string
  title?: string | null
  content?: any
  section_type?: string | null
  order_index?: number | null
}

type PlanResponse = {
  id: string
  name: string
  description?: string | null
  status?: string | null
  plan_sections?: PlanSection[]
}

const renderStructuredPlan = (doc: any): string | null => {
  if (!doc || typeof doc !== "object") return null
  try {
    const lines: string[] = []
    const meta = doc.metadata ?? {}
    if (meta.nombre || meta.fecha) {
      lines.push(`Plan de contenido para ${meta.nombre ?? "Creador"} (${meta.fecha ?? ""})`.trim())
    }
    if (doc.ruta_seleccionada) {
      lines.push(`Ruta seleccionada: ${doc.ruta_seleccionada}`)
    }
    if (doc.explicacion_ruta) {
      lines.push("", "Explicacion de la ruta:", doc.explicacion_ruta)
    }
    const perfil = doc.perfil_audiencia ?? {}
    if (Object.keys(perfil).length) {
      lines.push("", "Perfil de audiencia:")
      if (perfil.descripcion_general) lines.push(`- Descripcion general: ${perfil.descripcion_general}`)
      if (perfil.demografia) lines.push(`- Demografia: ${perfil.demografia}`)
      if (perfil.psicografia) lines.push(`- Psicografia: ${perfil.psicografia}`)
      if (perfil.pain_points?.length) lines.push(`- Pain points: ${perfil.pain_points.join("; ")}`)
      if (perfil.aspiraciones?.length) lines.push(`- Aspiraciones: ${perfil.aspiraciones.join("; ")}`)
      if (perfil.lenguaje_recomendado) lines.push(`- Lenguaje recomendado: ${perfil.lenguaje_recomendado}`)
    }
    const fundamentos = doc.fundamentos ?? {}
    if (fundamentos.pilares_contenido?.length) {
      lines.push("", "Fundamentos:")
      fundamentos.pilares_contenido.forEach((p: any, idx: number) => {
        lines.push(
          `Pilar ${idx + 1}: ${p.nombre} - ${p.descripcion}${
            p.proposito ? ` (proposito: ${p.proposito})` : ""
          }`.trim(),
        )
      })
    }
    if (fundamentos.tono_voz) lines.push(`Tono de voz: ${fundamentos.tono_voz}`)
    if (fundamentos.propuesta_valor) lines.push(`Propuesta de valor: ${fundamentos.propuesta_valor}`)

    if (doc.ideas_contenido?.length) {
      lines.push("", "Ideas de contenido:")
      doc.ideas_contenido.forEach((idea: any) => {
        const parts = [
          `#${idea.numero ?? ""} ${idea.tema ?? ""}`.trim(),
          idea.hook ? `Hook: ${idea.hook}` : "",
          idea.desarrollo ? `Desarrollo: ${idea.desarrollo}` : "",
          idea.punto_quiebre ? `Punto de quiebre: ${idea.punto_quiebre}` : "",
          idea.cta ? `CTA: ${idea.cta}` : "",
          idea.copy ? `Copy: ${idea.copy}` : "",
          idea.pilar ? `Pilar: ${idea.pilar}` : "",
        ].filter(Boolean)
        lines.push(parts.join(" | "))
      })
    }

    const rec = doc.recomendaciones ?? {}
    if (Object.keys(rec).length) {
      lines.push("", "Recomendaciones:")
      if (rec.frecuencia_publicacion) lines.push(`- Frecuencia: ${rec.frecuencia_publicacion}`)
      if (rec.mejores_horarios) lines.push(`- Horarios: ${rec.mejores_horarios}`)
      if (rec.hashtags_sugeridos?.length) lines.push(`- Hashtags: ${rec.hashtags_sugeridos.join(", ")}`)
      if (rec.formatos_prioritarios?.length)
        lines.push(`- Formatos prioritarios: ${rec.formatos_prioritarios.join(", ")}`)
      if (rec.metricas_clave?.length) lines.push(`- Metricas clave: ${rec.metricas_clave.join(", ")}`)
      if (rec.consejos_magicos?.length) lines.push(`- Consejos magicos: ${rec.consejos_magicos.join("; ")}`)
    }

    return lines.join("\n").trim().normalize("NFC")
  } catch {
    return null
  }
}

const extractTextFromDoc = (section?: PlanSection): { text: string; doc: any } => {
  if (!section?.content) return { text: "", doc: null }
  const doc = (section.content as any).plan_doc ?? (section.content as any).ai_doc ?? section.content
  if (typeof doc === "string") {
    return { text: doc, doc }
  }
  const structuredText = renderStructuredPlan(doc)
  const text =
    doc?.plan_text ??
    doc?.plan ??
    doc?.text ??
    structuredText ??
    (section.content as any).text ??
    (typeof doc === "object" ? JSON.stringify(doc, null, 2) : "")
  return { text: text ?? "", doc }
}

export default function PlanEditor() {
  const params = useParams()
  const router = useRouter()
  const planId = useMemo(() => String(params?.id ?? ""), [params])

  const [plan, setPlan] = useState<PlanResponse | null>(null)
  const [summarySectionId, setSummarySectionId] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingState, setSavingState] = useState<"idle" | "saving" | "error">("idle")
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const contentRef = useRef<HTMLDivElement>(null)
  const planDocRef = useRef<any>(null)
  const hasHydrated = useRef(false)

  useEffect(() => {
    if (contentRef.current && contentRef.current.innerText !== content) {
      contentRef.current.innerText = content
    }
  }, [content])

  const loadPlan = useCallback(async () => {
    if (!planId) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/plans/${planId}`)
      if (response.status === 401 || response.status === 403) {
        router.push("/auth")
        return
      }
      if (!response.ok) {
        throw new Error(`Error al cargar plan (${response.status})`)
      }
      const data: PlanResponse = await response.json()
      setPlan(data)

      const sections = data.plan_sections ?? []
      const summary =
        sections.find((s) => s.section_type === "summary") ??
        sections.find((s) => (s.content as any)?.plan_doc || (s.content as any)?.ai_doc) ??
        sections[0]

      if (summary?.id) {
        setSummarySectionId(summary.id)
      }

      const { text, doc } = extractTextFromDoc(summary)
      planDocRef.current = doc ?? null
      setTitle(data.name ?? "Plan sin nombre")
      setContent(text ?? "")
    } catch (err) {
      console.error("[plan-editor] load error", err)
      setError("No pudimos cargar el plan. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }, [planId, router])

  useEffect(() => {
    void loadPlan()
  }, [loadPlan])

  const persistPlan = useCallback(async () => {
    if (!planId || !summarySectionId) return
    setSavingState("saving")
    try {
      await fetch(`/api/plans/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: title }),
      })

      const baseDoc = planDocRef.current && typeof planDocRef.current === "object" ? { ...planDocRef.current } : {}
      const mergedDoc = { ...baseDoc, plan: content, plan_text: content }

      const payload = {
        content: {
          plan_doc: mergedDoc,
          text: content,
        },
      }

      await fetch(`/api/plans/${planId}/sections/${summarySectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      setSavingState("idle")
      setLastSaved(new Date())
      planDocRef.current = mergedDoc
    } catch (err) {
      console.error("[plan-editor] save error", err)
      setSavingState("error")
    }
  }, [content, planId, summarySectionId, title])

  useEffect(() => {
    if (!summarySectionId) return
    if (!hasHydrated.current) {
      hasHydrated.current = true
      return
    }
    const handle = setTimeout(() => {
      void persistPlan()
    }, 1000)
    return () => clearTimeout(handle)
  }, [content, title, summarySectionId, persistPlan])

  const handleContentInput = useCallback(() => {
    if (!contentRef.current) return
    setContent(contentRef.current.innerText)
  }, [])

  const handleDelete = useCallback(async () => {
    const confirmDelete = window.confirm("¿Eliminar este plan? Esta acción no se puede deshacer.")
    if (!confirmDelete) return
    try {
      const res = await fetch(`/api/plans/${planId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete plan")
      router.push("/planes")
    } catch (err) {
      console.error("[plan-editor] delete error", err)
      setError("No pudimos eliminar el plan.")
    }
  }, [planId, router])

  const planMeta = useMemo(() => {
    if (savingState === "saving") return "Guardando..."
    if (savingState === "error") return "Error al guardar"
    if (lastSaved)
      return `Todos los cambios guardados - hace ${Math.max(0, Math.floor((Date.now() - lastSaved.getTime()) / 1000))}s`
    return "Listo para editar"
  }, [savingState, lastSaved])

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/planes")}
              className="p-2 hover:bg-black/5 rounded-lg transition-colors"
              aria-label="Volver a planes"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-black/40">/planes/{planId}</p>
              <p className="text-sm text-black/60">{plan?.status ?? "Borrador"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-black/50">{planMeta}</span>
            <button
              onClick={handleDelete}
              className="rounded-md p-2 text-[var(--accent-600)] hover:bg-[var(--accent-600)]/10 transition-colors"
              title="Eliminar plan"
              aria-label="Eliminar plan"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">{error}</div>
        )}
        {loading ? (
          <div className="space-y-3">
            <div className="h-8 w-48 bg-black/5 rounded" />
            <div className="h-5 w-80 bg-black/5 rounded" />
            <div className="h-[300px] w-full bg-black/5 rounded" />
          </div>
        ) : (
          <div className="space-y-6">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Escribe un título..."
              className="w-full bg-transparent border-none outline-none text-4xl md:text-5xl font-semibold font-display tracking-tight text-black placeholder-black/30 focus:ring-0"
            />

            <div className="rounded-2xl border border-black/5 bg-white/80 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-black">Plan generado</p>
                  <p className="text-xs text-black/50">Edita y jerarquiza con títulos/subtítulos</p>
                </div>
              </div>
              <div
                ref={contentRef}
                contentEditable
                onInput={handleContentInput}
                className="w-full min-h-[360px] bg-transparent border-none outline-none text-base leading-7 text-black focus:ring-0 empty:before:content-[attr(data-placeholder)] empty:before:text-black/30"
                style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: "1.75" }}
                data-placeholder="Empieza a escribir tu plan..."
                role="textbox"
                aria-multiline="true"
                suppressContentEditableWarning={true}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
