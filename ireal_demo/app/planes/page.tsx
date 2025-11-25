"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, FileText, Search, Filter, MoreVertical, Calendar, X } from "lucide-react"
import { useNavigationState } from "@/hooks/useNavigationState"

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

const savePlanDoc = (id: string, doc: any) => {
  try {
    localStorage.setItem(PLAN_DOC_KEY(id), JSON.stringify(doc))
  } catch {
    // ignore
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
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [viewerPlan, setViewerPlan] = useState<Plan | null>(null)

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
      const withDocs = data.map((p) => ({ ...p, aiDoc: loadPlanDoc(p.id) }))
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
            onClick={() => setShowCreateModal(true)}
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
              <div key={plan.id} className="rounded-xl border border-[#E5E5E5] bg-white/60 p-5 hover:shadow-sm transition-shadow">
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
                    <button className="p-2 hover:bg-black/5 rounded-lg transition-colors" title="Más opciones">
                      <MoreVertical className="h-4 w-4 text-black/40" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreatePlanModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(plan, doc) => {
            savePlanDoc(plan.id, doc)
            setPlans((prev) => [...prev, { ...plan, aiDoc: doc }])
            setShowCreateModal(false)
            setViewerPlan({ ...plan, aiDoc: doc })
          }}
        />
      )}

      {viewerPlan && (
        <PlanViewer plan={viewerPlan} onClose={() => setViewerPlan(null)} />
      )}
    </div>
  )
}

function CreatePlanModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: (plan: Plan, doc: any) => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    nombre_cuenta: "",
    pasion: "",
    motivacion: "",
    audiencia: "",
    temas: "",
    vision: "",
    tiempo: "",
  })

  const toggleChannel = (channelId: string) => {
    // canales eliminados; no-op
    return channelId
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // 1) Generar plan con IA
      const aiPayload = {
        nombre: formData.nombre_cuenta || formData.name,
        pasion: formData.pasion,
        motivacion: formData.motivacion,
        conexion: formData.audiencia,
        temas: formData.temas,
        vision: formData.vision,
        tiempo: formData.tiempo,
      }

      const aiRes = await fetch("/api/ai/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiPayload),
      })

      const aiJson = await aiRes.json().catch(() => null)
      const aiDoc = aiJson?.data ?? aiJson ?? {}

      // 2) Crear plan (persistencia). Si falla, usamos un plan local para no romper el flujo.
      let plan: Plan | null = null
      try {
        const planRes = await fetch("/api/plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            status: "draft",
          }),
        })

        if (planRes.ok) {
          plan = (await planRes.json()) as Plan
        }
      } catch {
        // ignoramos, generamos fallback
      }

      if (!plan) {
        plan = {
          id: `local-${Date.now()}`,
          name: formData.name || "Plan sin nombre",
          status: "draft",
          start_date: null,
          end_date: null,
          plan_sections: [],
        }
      }

      onSuccess(plan, aiDoc)
    } catch (err) {
      console.error("[plans] Error creating plan with AI:", err)
      setError("No se pudo generar el plan con IA. Intenta de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--surface)] rounded-xl border border-[#E5E5E5] w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-4">
          <h2 className="font-display text-xl font-semibold text-black">Crear nuevo plan con IA</h2>
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Nombre del plan *"
                required
                value={formData.name}
                onChange={(v) => setFormData((p) => ({ ...p, name: v }))}
                placeholder="Ej: Campaña Q1"
                disabled={isSubmitting}
              />
            </div>

            <Input
              label="Nombre de la cuenta / creador"
              value={formData.nombre_cuenta}
              onChange={(v) => setFormData((p) => ({ ...p, nombre_cuenta: v }))}
              placeholder="Ej: Miguel / @ireal"
              disabled={isSubmitting}
            />

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="¿Qué más te gusta hacer / hablar?"
                value={formData.pasion}
                onChange={(v) => setFormData((p) => ({ ...p, pasion: v }))}
                placeholder="Temas que amas"
                disabled={isSubmitting}
              />
              <Input
                label="¿Por qué quieres crear contenido?"
                value={formData.motivacion}
                onChange={(v) => setFormData((p) => ({ ...p, motivacion: v }))}
                placeholder="Motivación/sueño"
                disabled={isSubmitting}
              />
            </div>

            <Input
              label="Describe a la persona con la que quieres conectar"
              value={formData.audiencia}
              onChange={(v) => setFormData((p) => ({ ...p, audiencia: v }))}
              placeholder="Su perfil, intereses, qué le importa"
              disabled={isSubmitting}
            />

            <Input
              label="Temas/historias que necesitas compartir"
              value={formData.temas}
              onChange={(v) => setFormData((p) => ({ ...p, temas: v }))}
              placeholder="Lista de temas clave"
              disabled={isSubmitting}
            />

            <Input
              label="Visión a 6 meses (éxito)"
              value={formData.vision}
              onChange={(v) => setFormData((p) => ({ ...p, vision: v }))}
              placeholder="¿Qué estaría pasando?"
              disabled={isSubmitting}
            />

            <Input
              label="Tiempo semanal disponible"
              value={formData.tiempo}
              onChange={(v) => setFormData((p) => ({ ...p, tiempo: v }))}
              placeholder="Ej: 5 horas/semana"
              disabled={isSubmitting}
            />

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-sm text-black bg-white/40 border border-[#E5E5E5] rounded-lg hover:bg-white/60 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-sm text-black hover:text-white hover:bg-[var(--accent-600)] rounded-lg ring-1 ring-transparent hover:ring-[var(--accent-600)]/70 hover:shadow-[0_0_0_6px_rgba(138,15,28,0.10)] transition-all duration-200 font-medium disabled:opacity-50"
              >
                {isSubmitting ? "Generando..." : "Crear plan con IA"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-black mb-2">
        {label} {required && "*"}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/40 border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-lg px-3 py-2 text-sm transition-colors"
        placeholder={placeholder}
        disabled={disabled}
        required={required}
      />
    </div>
  )
}

function PlanViewer({ plan, onClose }: { plan: Plan; onClose: () => void }) {
  const doc = plan.aiDoc || loadPlanDoc(plan.id)
  const docObject = typeof doc === "string" ? { plan: doc } : doc || {}
  const planText = docObject.plan || docObject.plan_text || null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--surface)] rounded-xl border border-[#E5E5E5] w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold text-black">Documento del plan</h2>
              <p className="text-black/60 text-sm">{plan.name}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-lg transition-colors" aria-label="Cerrar">
              <X className="h-5 w-5 text-black/60" />
            </button>
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
                  <p className="text-sm text-black/70 whitespace-pre-line">{docObject.perfil_audiencia?.descripcion_general}</p>
                  <p className="text-sm text-black/70">Demografía: {docObject.perfil_audiencia?.demografia}</p>
                  <p className="text-sm text-black/70">Psicografía: {docObject.perfil_audiencia?.psicografia}</p>
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
                        <p className="text-sm text-black/60">Propósito: {p.proposito}</p>
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
                      <p className="text-sm text-black/60">Mostrando 10 ideas. Hay más en el documento.</p>
                    )}
                  </div>
                </Section>
              )}

              {docObject.recomendaciones && (
                <Section title="Recomendaciones">
                  <div className="space-y-2">
                    <p className="text-sm text-black/70">Frecuencia: {docObject.recomendaciones?.frecuencia_publicacion}</p>
                    <p className="text-sm text-black/70">Horarios: {docObject.recomendaciones?.mejores_horarios}</p>
                    <p className="text-sm text-black/70">
                      Hashtags: {(docObject.recomendaciones?.hashtags_sugeridos || []).join(", ")}
                    </p>
                    <p className="text-sm text-black/70">
                      Formatos: {(docObject.recomendaciones?.formatos_prioritarios || []).join(", ")}
                    </p>
                    <p className="text-sm text-black/70">Métricas: {(docObject.recomendaciones?.metricas_clave || []).join(" , ")}}</p>
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









