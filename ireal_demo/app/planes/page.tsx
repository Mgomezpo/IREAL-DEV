"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, FileText, Search, Filter, MoreVertical, Calendar, X, Trash2 } from "lucide-react"
import { useNavigationState } from "@/hooks/useNavigationState"
import { HardCard } from "@/components/ui/hard-card"

type Plan = {
  id: string
  name: string
  status?: string
  start_date?: string | null
  end_date?: string | null
  plan_sections?: any[]
  aiDoc?: any
}

const PLAN_DOC_KEY = (id: string) => `ireal:plans:doc:${id}`

const loadPlanDoc = (id: string) => {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(PLAN_DOC_KEY(id))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default function Planes() {
  const router = useRouter()
  const { registerState } = useNavigationState()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewerPlan, setViewerPlan] = useState<Plan | null>(null)

  useEffect(() => {
    const prev = document.body.style.overflow
    if (viewerPlan) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = prev
    }
    return () => {
      document.body.style.overflow = prev
    }
  }, [viewerPlan])

  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    if (viewerPlan) {
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [viewerPlan])

  useEffect(() => {
    fetchPlans()
  }, [])

  useEffect(() => {
    registerState({ planCount: plans.length })
  }, [registerState, plans.length])

  const fetchPlans = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/plans")

      if (response.status === 401 || response.status === 403) {
        router.push("/auth")
        return
      }

      if (!response.ok) {
        throw new Error("Error al cargar planes")
      }

      const data = (await response.json()) as Plan[]
      const withDocs = data.map((p) => {
        const serverDoc = (p as any).plan_doc ?? (p as any).ai_doc
        const storedDoc = loadPlanDoc(p.id)
        const effectiveDoc = storedDoc ?? serverDoc ?? null
        if (serverDoc && JSON.stringify(serverDoc) !== JSON.stringify(storedDoc)) {
          try {
            localStorage.setItem(PLAN_DOC_KEY(p.id), JSON.stringify(serverDoc))
          } catch (err) {
            console.error("[plans] Error persisting plan doc locally", err)
          }
        }
        return { ...p, plan_doc: effectiveDoc, aiDoc: effectiveDoc }
      })
      setPlans(withDocs)
    } catch (err) {
      console.error("[plans] Error fetching plans:", err)
      setError("Error al cargar planes. Por favor, intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const handleNavigation = (path: string) => {
    setIsTransitioning(true)
    setTimeout(() => {
      router.push(path)
    }, 350)
  }

  const filteredPlans = useMemo(
    () => plans.filter((plan) => (plan.name || "").toLowerCase().includes(searchQuery.toLowerCase())),
    [plans, searchQuery],
  )

  const deletePlan = async (planId: string) => {
    const confirmDelete = window.confirm("¿Eliminar este plan? Esta acción no se puede deshacer.")
    if (!confirmDelete) return

    try {
      const response = await fetch(`/api/plans/${planId}`, { method: "DELETE" })
      if (!response.ok) {
        throw new Error("No se pudo eliminar el plan")
      }
      try {
        localStorage.removeItem(PLAN_DOC_KEY(planId))
      } catch (err) {
        console.warn("[plans] No se pudo limpiar el doc en localStorage", err)
      }
      setPlans((prev) => prev.filter((p) => p.id !== planId))
      setViewerPlan(null)
    } catch (err) {
      console.error("[plans] Error deleting plan:", err)
      alert("No pudimos eliminar el plan. Intenta de nuevo.")
    }
  }

  const getStatusBadge = (status?: string) => {
    const styles: Record<string, string> = {
      draft: "bg-yellow-100 text-yellow-800 border-yellow-200",
      active: "bg-green-100 text-green-800 border-green-200",
      archived: "bg-gray-100 text-gray-800 border-gray-200",
    }
    const labels: Record<string, string> = {
      draft: "Borrador",
      active: "Activo",
      archived: "Archivado",
    }
    if (!status) return null
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status] ?? ""}`}>
        {labels[status] ?? status}
      </span>
    )
  }

  return (
    <div className={`min-h-screen bg-[var(--surface)] ${isTransitioning ? "notebook-exit" : "notebook-enter"}`}>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => handleNavigation("/dashboard")}
            className="p-2 hover:bg-black/5 rounded-lg transition-colors"
            aria-label="Volver al dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl tracking-tight font-semibold font-display text-black">Planes de contenido</h1>
            <p className="text-black/70 mt-1 text-base leading-7">Estrategias que cobran vida con IA</p>
          </div>
          <button
            onClick={() => router.push("/planes/new")}
            className="group relative text-base text-black hover:text-white hover:bg-[var(--accent-600)] rounded-sm ring-1 ring-transparent hover:ring-[var(--accent-600)]/70 hover:shadow-[0_0_0_6px_rgba(138,15,28,0.10)] px-4 py-2 transition-all duration-200 font-medium"
          >
            <Plus className="h-4 w-4 inline mr-2" />
            Crear nuevo plan
          </button>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar plan..."
                className="w-full rounded-lg border border-black/10 bg-white/70 py-3 pl-9 pr-4 text-sm text-black placeholder:text-black/40 focus:border-black focus:outline-none focus:ring-0"
              />
            </div>
            <button className="p-2 hover:bg-black/5 rounded-lg transition-colors" title="Filtros">
              <Filter className="h-5 w-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3 rounded-xl border border-black/5 bg-white/50 p-6 text-sm text-black/60">
            <div className="h-5 w-24 bg-black/5 rounded" />
            <div className="h-5 w-full bg-black/5 rounded" />
            <div className="h-5 w-3/4 bg-black/5 rounded" />
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/10 bg-white/40 p-8 text-center text-sm text-black/60">
            No hay planes. Crea uno nuevo con IA.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPlans.map((plan) => (
              <HardCard key={plan.id} className="animate-fade-in-up">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-black/60" />
                      <h3 className="font-display text-lg font-semibold text-black">{plan.name}</h3>
                      {getStatusBadge(plan.status)}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2 text-xs text-black/60">
                      {plan.start_date && <span>Inicio: {plan.start_date}</span>}
                      {plan.end_date && <span>Fin: {plan.end_date}</span>}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Formato: video corto
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewerPlan(plan)}
                      className="text-sm text-[var(--accent-600)] hover:underline"
                    >
                      Ver documento
                    </button>
                    <button className="p-2 hover:bg-black/5 rounded-lg transition-colors" title="M├ís opciones">
                      <MoreVertical className="h-4 w-4 text-black/60" />
                    </button>
                  </div>
                </div>
              </HardCard>
            ))}
          </div>
        )}
      </div>

      {viewerPlan && (
        <PlanViewer plan={viewerPlan} onClose={() => setViewerPlan(null)} onDelete={() => deletePlan(viewerPlan.id)} />
      )}
    </div>
  )
}

function PlanViewer({ plan, onClose, onDelete }: { plan: Plan; onClose: () => void; onDelete: () => void }) {
  const doc = plan.aiDoc || loadPlanDoc(plan.id)
  const docObject = typeof doc === "string" ? { plan: doc } : doc || {}
  const planText = docObject.plan || docObject.plan_text || null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="hard-shadow animate-fade-in-up max-w-5xl w-full max-h-[85vh] bg-[var(--surface)] overflow-hidden rounded-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="p-6 space-y-4 overflow-y-auto max-h-[85vh] pr-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold text-black">Documento del plan</h2>
              <p className="text-black/60 text-sm">{plan.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onDelete}
                className="rounded-md p-2 text-[var(--accent-600)] hover:bg-[var(--accent-600)]/10 transition-colors"
                title="Eliminar plan"
                aria-label="Eliminar plan"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-black/5 rounded-lg transition-colors"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5 text-black/60" />
              </button>
            </div>
          </div>

          {!doc ? (
            <div className="rounded-lg bg-white/60 border border-black/10 p-4 text-sm text-black/70">
              No hay documento generado para este plan.
            </div>
          ) : (
            <div className="space-y-4">
              {planText && (
                <Section title="Plan generado">
                  <p className="text-sm text-black/70 whitespace-pre-line">{planText}</p>
                </Section>
              )}

              {docObject.ruta_seleccionada && (
                <Section title="Ruta seleccionada">
                  <p className="text-sm text-black">
                    <strong>{docObject.ruta_seleccionada}</strong>
                  </p>
                  <p className="text-sm text-black/70 whitespace-pre-line">{docObject.explicacion_ruta}</p>
                </Section>
              )}

              {docObject.perfil_audiencia && (
                <Section title="Perfil de audiencia">
                  <p className="text-sm text-black/70 whitespace-pre-line">
                    {docObject.perfil_audiencia?.descripcion_general}
                  </p>
                  <p className="text-sm text-black/70">Demograf├¡a: {docObject.perfil_audiencia?.demografia}</p>
                  <p className="text-sm text-black/70">Psicograf├¡a: {docObject.perfil_audiencia?.psicografia}</p>
                  <p className="text-sm text-black/70 whitespace-pre-line">
                    Pain points:
                    {"\n"}
                    {(docObject.perfil_audiencia?.pain_points || []).join("\n")}
                  </p>
                  <p className="text-sm text-black/70 whitespace-pre-line">
                    Aspiraciones:
                    {"\n"}
                    {(docObject.perfil_audiencia?.aspiraciones || []).join("\n")}
                  </p>
                </Section>
              )}

              {docObject.fundamentos?.pilares_contenido && (
                <Section title="Pilares de contenido">
                  <div className="space-y-2">
                    {(docObject.fundamentos?.pilares_contenido || []).map((p: any, idx: number) => (
                      <div key={idx} className="rounded-lg bg-white/70 border border-black/10 p-3">
                        <p className="font-semibold text-black">{p.nombre}</p>
                        <p className="text-sm text-black/70">{p.descripcion}</p>
                        <p className="text-sm text-black/60">Prop├│sito: {p.proposito}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {docObject.ideas_contenido && (
                <Section title={`Ideas de contenido (${docObject.ideas_contenido?.length || 0})`}>
                  <div className="space-y-2">
                    {(docObject.ideas_contenido || []).slice(0, 10).map((idea: any) => (
                      <div key={idea.numero} className="rounded-lg bg-white/70 border border-black/10 p-3">
                        <p className="font-semibold text-black">
                          #{idea.numero} - {idea.tema}
                        </p>
                        <p className="text-sm text-black/70">Hook: {idea.hook}</p>
                        <p className="text-sm text-black/70 whitespace-pre-line">{idea.desarrollo}</p>
                        <p className="text-sm text-black/60">CTA: {idea.cta}</p>
                      </div>
                    ))}
                    {docObject.ideas_contenido && docObject.ideas_contenido.length > 10 && (
                      <p className="text-sm text-black/60">Mostrando 10 ideas. Hay m├ís en el documento.</p>
                    )}
                  </div>
                </Section>
              )}

              {docObject.recomendaciones && (
                <Section title="Recomendaciones">
                  <div className="space-y-2">
                    <p className="text-sm text-black/70">
                      Frecuencia: {docObject.recomendaciones?.frecuencia_publicacion}
                    </p>
                    <p className="text-sm text-black/70">Horarios: {docObject.recomendaciones?.mejores_horarios}</p>
                    <p className="text-sm text-black/70">
                      Hashtags: {(docObject.recomendaciones?.hashtags_sugeridos || []).join(", ")}
                    </p>
                    <p className="text-sm text-black/70">
                      Formatos: {(docObject.recomendaciones?.formatos_prioritarios || []).join(", ")}
                    </p>
                    <p className="text-sm text-black/70">
                      M├®tricas: {(docObject.recomendaciones?.metricas_clave || []).join(", ")}
                    </p>
                    <p className="text-sm text-black/70 whitespace-pre-line">{docObject.recomendaciones?.consejos_magicos}</p>
                  </div>
                </Section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-black">{title}</h3>
      <div className="text-sm text-black/70 space-y-1">{children}</div>
    </div>
  )
}

