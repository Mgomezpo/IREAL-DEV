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

type StructuredPlanDoc = {
  ruta_seleccionada?: string
  explicacion_ruta?: string
  metadata?: { nombre?: string; fecha?: string }
  perfil_audiencia?: {
    descripcion_general?: string
    demografia?: string
    psicografia?: string
    pain_points?: string[]
    aspiraciones?: string[]
    lenguaje_recomendado?: string
  }
  fundamentos?: {
    pilares_contenido?: Array<{ nombre?: string; descripcion?: string; proposito?: string }>
    tono_voz?: string
    propuesta_valor?: string
  }
  ideas_contenido?: Array<{
    numero?: number
    tema?: string
    hook?: string
    desarrollo?: string
    punto_quiebre?: string
    cta?: string
    copy?: string
    pilar?: string
  }>
  recomendaciones?: {
    frecuencia_publicacion?: string
    mejores_horarios?: string
    hashtags_sugeridos?: string[]
    formatos_prioritarios?: string[]
    metricas_clave?: string[]
    consejos_magicos?: string[]
  }
}

const normalizeStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : String(item ?? "").trim()))
      .filter(Boolean)
  }
  if (typeof value === "string") {
    return value
      .split(/[\n,;]+/)
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return []
}

const normalizePlanDoc = (doc: any): StructuredPlanDoc | null => {
  if (!doc || typeof doc !== "object") return null
  const ideas = Array.isArray(doc.ideas_contenido)
    ? [...doc.ideas_contenido].map((idea, idx) => {
        const parsedNumero =
          typeof idea?.numero === "number"
            ? idea.numero
            : Number.parseInt(String(idea?.numero ?? idx + 1), 10)
        const numero = Number.isFinite(parsedNumero) ? parsedNumero : idx + 1
        return {
          numero,
          tema: typeof idea?.tema === "string" ? idea.tema : "",
          hook: typeof idea?.hook === "string" ? idea.hook : "",
          desarrollo: typeof idea?.desarrollo === "string" ? idea.desarrollo : "",
          punto_quiebre: typeof idea?.punto_quiebre === "string" ? idea.punto_quiebre : "",
          cta: typeof idea?.cta === "string" ? idea.cta : "",
          copy: typeof idea?.copy === "string" ? idea.copy : "",
          pilar: typeof idea?.pilar === "string" ? idea.pilar : "",
        }
      })
    : []

  return {
    ruta_seleccionada:
      typeof doc.ruta_seleccionada === "string"
        ? doc.ruta_seleccionada
        : typeof doc.ruta === "string"
          ? doc.ruta
          : undefined,
    explicacion_ruta: typeof doc.explicacion_ruta === "string" ? doc.explicacion_ruta : doc.explicacion ?? undefined,
    metadata: {
      nombre:
        typeof doc.metadata?.nombre === "string"
          ? doc.metadata.nombre
          : typeof doc.nombre === "string"
            ? doc.nombre
            : undefined,
      fecha:
        typeof doc.metadata?.fecha === "string"
          ? doc.metadata.fecha
          : typeof doc.fecha === "string"
            ? doc.fecha
            : undefined,
    },
    perfil_audiencia: {
      descripcion_general:
        typeof doc.perfil_audiencia?.descripcion_general === "string" ? doc.perfil_audiencia.descripcion_general : undefined,
      demografia: typeof doc.perfil_audiencia?.demografia === "string" ? doc.perfil_audiencia.demografia : undefined,
      psicografia: typeof doc.perfil_audiencia?.psicografia === "string" ? doc.perfil_audiencia.psicografia : undefined,
      pain_points: normalizeStringArray(doc.perfil_audiencia?.pain_points),
      aspiraciones: normalizeStringArray(doc.perfil_audiencia?.aspiraciones),
      lenguaje_recomendado:
        typeof doc.perfil_audiencia?.lenguaje_recomendado === "string" ? doc.perfil_audiencia.lenguaje_recomendado : undefined,
    },
    fundamentos: {
      pilares_contenido: Array.isArray(doc.fundamentos?.pilares_contenido)
        ? doc.fundamentos.pilares_contenido.map((p: any) => ({
            nombre: typeof p?.nombre === "string" ? p.nombre : "",
            descripcion: typeof p?.descripcion === "string" ? p.descripcion : "",
            proposito: typeof p?.proposito === "string" ? p.proposito : "",
          }))
        : [],
      tono_voz: typeof doc.fundamentos?.tono_voz === "string" ? doc.fundamentos.tono_voz : undefined,
      propuesta_valor: typeof doc.fundamentos?.propuesta_valor === "string" ? doc.fundamentos.propuesta_valor : undefined,
    },
    ideas_contenido: ideas.sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0)),
    recomendaciones: {
      frecuencia_publicacion:
        typeof doc.recomendaciones?.frecuencia_publicacion === "string" ? doc.recomendaciones.frecuencia_publicacion : undefined,
      mejores_horarios:
        typeof doc.recomendaciones?.mejores_horarios === "string" ? doc.recomendaciones.mejores_horarios : undefined,
      hashtags_sugeridos: normalizeStringArray(doc.recomendaciones?.hashtags_sugeridos),
      formatos_prioritarios: normalizeStringArray(doc.recomendaciones?.formatos_prioritarios),
      metricas_clave: normalizeStringArray(doc.recomendaciones?.metricas_clave),
      consejos_magicos: normalizeStringArray(doc.recomendaciones?.consejos_magicos),
    },
  }
}

const renderStructuredPlan = (doc: any): string | null => {
  if (!doc || typeof doc !== "object") return null
  try {
    const lines: string[] = []
    const meta = doc.metadata ?? {}
    if (meta.nombre || meta.fecha) {
      lines.push(`# Plan de contenido para ${meta.nombre ?? "Creador"} (${meta.fecha ?? ""})`.trim())
    }
    if (doc.ruta_seleccionada) {
      lines.push("", "## Estrategia General", `Ruta seleccionada: ${doc.ruta_seleccionada}`)
    }
    if (doc.explicacion_ruta) {
      lines.push("Explicacion de la ruta:", doc.explicacion_ruta)
    }
    const perfil = doc.perfil_audiencia ?? {}
    if (Object.keys(perfil).length) {
      lines.push("", "## Perfil de audiencia")
      if (perfil.descripcion_general) lines.push(`- Descripcion general: ${perfil.descripcion_general}`)
      if (perfil.demografia) lines.push(`- Demografia: ${perfil.demografia}`)
      if (perfil.psicografia) lines.push(`- Psicografia: ${perfil.psicografia}`)
      if (perfil.pain_points?.length) lines.push(`- Pain points: ${perfil.pain_points.join("; ")}`)
      if (perfil.aspiraciones?.length) lines.push(`- Aspiraciones: ${perfil.aspiraciones.join("; ")}`)
      if (perfil.lenguaje_recomendado) lines.push(`- Lenguaje recomendado: ${perfil.lenguaje_recomendado}`)
    }
    const fundamentos = doc.fundamentos ?? {}
    if (fundamentos.pilares_contenido?.length) {
      lines.push("", "## Fundamentos")
      fundamentos.pilares_contenido.forEach((p: any, idx: number) => {
        lines.push(
          `Pilar ${idx + 1}: ${p.nombre} - ${p.descripcion}${p.proposito ? ` (proposito: ${p.proposito})` : ""}`.trim(),
        )
      })
    }
    if (fundamentos.tono_voz) lines.push(`Tono de voz: ${fundamentos.tono_voz}`)
    if (fundamentos.propuesta_valor) lines.push(`Propuesta de valor: ${fundamentos.propuesta_valor}`)

    if (doc.ideas_contenido?.length) {
      lines.push("", "## Grilla de contenido")
      doc.ideas_contenido.forEach((idea: any) => {
        const parts = [`#${idea.numero ?? ""} ${idea.tema ?? ""}`.trim(), idea.hook ? `Hook: ${idea.hook}` : "", idea.cta ? `CTA: ${idea.cta}` : ""].filter(Boolean)
        lines.push(parts.join(" | "))
      })
    }

    const rec = doc.recomendaciones ?? {}
    if (Object.keys(rec).length) {
      lines.push("", "## Recomendaciones")
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
  const [structuredDoc, setStructuredDoc] = useState<StructuredPlanDoc | null>(null)
  const [summarySectionId, setSummarySectionId] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingState, setSavingState] = useState<"idle" | "saving" | "error">("idle")
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showRawEditor, setShowRawEditor] = useState(false)

  const contentRef = useRef<HTMLDivElement>(null)
  const planDocRef = useRef<any>(null)
  const hasHydrated = useRef(false)

  useEffect(() => {
    if (contentRef.current && contentRef.current.innerText !== content) {
      contentRef.current.innerText = content
    }
  }, [content, showRawEditor])

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
      setStructuredDoc(normalizePlanDoc(doc))
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
      setStructuredDoc(normalizePlanDoc(mergedDoc))
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
              <p className="text-xs uppercase tracking-[0.2em] text-black/40">
                /planes/{(plan?.name || title || planId || "").toString()}
              </p>
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
              aria-label="Título del plan"
              role="heading"
              aria-level={1}
            />

            <div className="rounded-2xl border border-black/5 bg-white/80 p-6 space-y-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1" />
                {structuredDoc?.ruta_seleccionada ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-50,#fef2f3)] px-3 py-1 text-xs font-semibold text-[var(--accent-700,#8a0f1c)] ring-1 ring-[var(--accent-600,#8a0f1c)]/20">
                    ✨ Ruta: {structuredDoc.ruta_seleccionada}
                  </span>
                ) : null}
              </div>

              {structuredDoc ? (
                <StructuredPlanView plan={structuredDoc} />
              ) : (
                <div className="rounded-xl border border-dashed border-black/10 bg-white/60 p-4 text-sm text-black/60">
                  No encontramos un documento estructurado. Usa el editor de texto plano para completar el plan.
                </div>
              )}

              <div className="flex items-center justify-between border-t border-black/5 pt-4">
                <div>
                  <p className="text-sm font-semibold text-black">Modo texto plano</p>
                  <p className="text-xs text-black/50">Edita el contenido sin formato cuando lo necesites.</p>
                </div>
                <button
                  onClick={() => setShowRawEditor((prev) => !prev)}
                  className="text-sm font-semibold text-[var(--accent-600)] hover:underline"
                >
                  {showRawEditor ? "Ocultar editor" : "Mostrar editor"}
                </button>
              </div>

              {showRawEditor && (
                <div className="rounded-xl border border-black/5 bg-white/70 p-4">
                  <div
                    ref={contentRef}
                    contentEditable
                    onInput={handleContentInput}
                    className="w-full min-h-[260px] bg-transparent border-none outline-none text-base leading-7 text-black focus:ring-0 empty:before:content-[attr(data-placeholder)] empty:before:text-black/30"
                    style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: "1.75" }}
                    data-placeholder="Empieza a escribir tu plan..."
                    role="textbox"
                    aria-multiline="true"
                    suppressContentEditableWarning={true}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const SectionTitle = ({ emoji, children }: { emoji: string; children: string }) => (
  <div className="flex items-center gap-2 mb-3">
    <span className="text-xl md:text-2xl">{emoji}</span>
    <h2 className="text-xl md:text-2xl font-semibold font-display text-black">{children}</h2>
  </div>
)

const StructuredPlanView = ({ plan }: { plan: StructuredPlanDoc }) => {
  const ideaCountLabel = plan.ideas_contenido?.length ? `(${plan.ideas_contenido.length} ideas)` : ""
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <div className="rounded-2xl border border-black/5 bg-white/70 p-5 shadow-sm space-y-3">
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-black/70">
            {plan.metadata?.nombre ? (
              <span className="rounded-full bg-black/5 px-3 py-1">👤 {plan.metadata.nombre}</span>
            ) : null}
            {plan.metadata?.fecha ? (
              <span className="rounded-full bg-black/5 px-3 py-1">📅 {plan.metadata.fecha}</span>
            ) : null}
            {plan.ruta_seleccionada ? (
              <span className="rounded-full bg-[var(--accent-600)]/10 text-[var(--accent-700,#8a0f1c)] px-3 py-1">
                🔮 Ruta: {plan.ruta_seleccionada}
              </span>
            ) : null}
          </div>
          {plan.explicacion_ruta ? (
            <p className="text-base leading-7 text-black/80">{plan.explicacion_ruta}</p>
          ) : (
            <p className="text-sm text-black/50">Agrega la explicación de la ruta para orientar la ejecución.</p>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle emoji="🧙‍♂️" children="Perfil de Audiencia" />
        <div className="rounded-2xl border border-black/5 bg-white/70 p-5 shadow-sm">
          <ul className="space-y-2 text-sm leading-7 text-black/80">
            {plan.perfil_audiencia?.descripcion_general ? (
              <li>
                <span className="font-semibold text-black">Descripción general:</span> {plan.perfil_audiencia.descripcion_general}
              </li>
            ) : null}
            {plan.perfil_audiencia?.demografia ? (
              <li>
                <span className="font-semibold text-black">Demografía:</span> {plan.perfil_audiencia.demografia}
              </li>
            ) : null}
            {plan.perfil_audiencia?.psicografia ? (
              <li>
                <span className="font-semibold text-black">Psicografía:</span> {plan.perfil_audiencia.psicografia}
              </li>
            ) : null}
            {plan.perfil_audiencia?.pain_points?.length ? (
              <li>
                <span className="font-semibold text-black">Pain Points:</span> {plan.perfil_audiencia.pain_points.join("; ")}
              </li>
            ) : null}
            {plan.perfil_audiencia?.aspiraciones?.length ? (
              <li>
                <span className="font-semibold text-black">Aspiraciones:</span> {plan.perfil_audiencia.aspiraciones.join("; ")}
              </li>
            ) : null}
            {plan.perfil_audiencia?.lenguaje_recomendado ? (
              <li>
                <span className="font-semibold text-black">Lenguaje recomendado:</span> {plan.perfil_audiencia.lenguaje_recomendado}
              </li>
            ) : null}
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle emoji="🪄" children="Fundamentos" />
        <div className="rounded-2xl border border-black/5 bg-white/70 p-5 shadow-sm space-y-4">
          {plan.fundamentos?.pilares_contenido?.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {plan.fundamentos.pilares_contenido.map((pilar, index) => (
                <div key={`${pilar?.nombre ?? index}-${index}`} className="rounded-xl border border-black/5 bg-white p-3">
                  <p className="text-sm font-semibold text-black">
                    Pilar {index + 1}: {pilar?.nombre || "Sin título"}
                  </p>
                  {pilar?.descripcion ? <p className="text-sm text-black/70 mt-1">{pilar.descripcion}</p> : null}
                  {pilar?.proposito ? (
                    <p className="text-xs text-black/60 mt-2">
                      <span className="font-semibold text-black">Propósito:</span> {pilar.proposito}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-black/50">Añade pilares de contenido para dar enfoque al plan.</p>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            {plan.fundamentos?.tono_voz ? (
              <div className="rounded-xl border border-black/5 bg-white p-3 text-sm text-black/80">
                <span className="font-semibold text-black">Tono de voz:</span> {plan.fundamentos.tono_voz}
              </div>
            ) : null}
            {plan.fundamentos?.propuesta_valor ? (
              <div className="rounded-xl border border-black/5 bg-white p-3 text-sm text-black/80">
                <span className="font-semibold text-black">Propuesta de valor:</span> {plan.fundamentos.propuesta_valor}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle emoji="✨" children={`Grilla de Contenido ${ideaCountLabel}`} />
        {plan.ideas_contenido?.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {plan.ideas_contenido.map((idea, index) => (
              <div
                key={`${idea.numero ?? index}-${idea.tema ?? "idea"}`}
                className="rounded-xl border border-black/5 bg-white p-4 shadow-sm space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-semibold text-black leading-6">
                    #{idea.numero ?? index + 1} {idea.tema ?? "Idea sin título"}
                  </h3>
                  {idea.pilar ? (
                    <span className="rounded-full bg-[var(--accent-600)]/10 px-3 py-1 text-[0.70rem] font-semibold text-[var(--accent-700,#8a0f1c)]">
                      Pilar: {idea.pilar}
                    </span>
                  ) : null}
                </div>
                {idea.hook ? (
                  <p className="text-sm text-black/80 leading-6">
                    🪝 <span className="font-semibold text-black">Hook:</span> {idea.hook}
                  </p>
                ) : null}
                {idea.desarrollo ? (
                  <p className="text-sm text-black/75 leading-6">
                    📜 <span className="font-semibold text-black">Desarrollo:</span> {idea.desarrollo}
                  </p>
                ) : null}
                {idea.punto_quiebre ? (
                  <p className="text-sm text-black/75 leading-6">
                    🌀 <span className="font-semibold text-black">Punto de quiebre:</span> {idea.punto_quiebre}
                  </p>
                ) : null}
                {idea.cta ? (
                  <p className="text-sm text-black/80 leading-6">
                    📣 <span className="font-semibold text-black">CTA:</span> {idea.cta}
                  </p>
                ) : null}
                {idea.copy ? (
                  <p className="text-xs text-black/60 leading-5 border-t border-black/5 pt-2">
                    <span className="font-semibold text-black">Copy:</span> {idea.copy}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-black/10 bg-white/60 p-4 text-sm text-black/60">
            Genera o pega ideas para poblar la grilla de contenido.
          </div>
        )}
      </section>

      <section className="space-y-3">
        <SectionTitle emoji="🧪" children="Recomendaciones" />
        <div className="rounded-2xl border border-black/5 bg-white/70 p-5 shadow-sm">
          <ul className="space-y-2 text-sm leading-7 text-black/80">
            {plan.recomendaciones?.frecuencia_publicacion ? (
              <li>
                <span className="font-semibold text-black">Frecuencia:</span> {plan.recomendaciones.frecuencia_publicacion}
              </li>
            ) : null}
            {plan.recomendaciones?.mejores_horarios ? (
              <li>
                <span className="font-semibold text-black">Horarios:</span> {plan.recomendaciones.mejores_horarios}
              </li>
            ) : null}
            {plan.recomendaciones?.formatos_prioritarios?.length ? (
              <li>
                <span className="font-semibold text-black">Formatos prioritarios:</span>{" "}
                {plan.recomendaciones.formatos_prioritarios.join(", ")}
              </li>
            ) : null}
            {plan.recomendaciones?.hashtags_sugeridos?.length ? (
              <li>
                <span className="font-semibold text-black">Hashtags:</span> {plan.recomendaciones.hashtags_sugeridos.join(", ")}
              </li>
            ) : null}
            {plan.recomendaciones?.metricas_clave?.length ? (
              <li>
                <span className="font-semibold text-black">Métricas clave:</span> {plan.recomendaciones.metricas_clave.join(", ")}
              </li>
            ) : null}
            {plan.recomendaciones?.consejos_magicos?.length ? (
              <li>
                <span className="font-semibold text-black">Consejos mágicos:</span> {plan.recomendaciones.consejos_magicos.join("; ")}
              </li>
            ) : null}
          </ul>
        </div>
      </section>
    </div>
  )
}
