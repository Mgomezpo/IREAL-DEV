"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, FileText, Search, Filter, MoreVertical, Calendar } from "lucide-react"

export default function Planes() {
  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchPlans()
  }, [])

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

      const data = await response.json()
      setPlans(data)
    } catch (err) {
      console.error("[v0] Error fetching plans:", err)
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

  const filteredPlans = plans.filter(
    (plan) =>
      plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: "bg-yellow-100 text-yellow-800 border-yellow-200",
      active: "bg-green-100 text-green-800 border-green-200",
      archived: "bg-gray-100 text-gray-800 border-gray-200",
    }
    const labels = {
      draft: "Borrador",
      active: "Activo",
      archived: "Archivado",
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const getChannelIcon = (channel: string) => {
    const icons = {
      IG: "📷",
      YT: "📺",
      TT: "🎵",
      LI: "💼",
      X: "🐦",
      FB: "👥",
      GEN: "📝",
    }
    return icons[channel as keyof typeof icons] || "📝"
  }

  return (
    <div className={`min-h-screen bg-[var(--surface)] ${isTransitioning ? "notebook-exit" : "notebook-enter"}`}>
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
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
            <p className="text-black/70 mt-1 text-base leading-7">Estrategias que cobran vida</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="group relative text-base text-black hover:text-white hover:bg-[var(--accent-600)] rounded-sm ring-1 ring-transparent hover:ring-[var(--accent-600)]/70 hover:shadow-[0_0_0_6px_rgba(138,15,28,0.10)] px-4 py-2 transition-all duration-200 font-medium"
          >
            <Plus className="h-4 w-4 inline mr-2" />
            Crear nuevo plan
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40" />
            <input
              type="text"
              placeholder="Buscar planes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/40 border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-lg pl-10 pr-4 py-3 text-sm placeholder-black/40 transition-colors"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-3 bg-white/40 border border-[#E5E5E5] rounded-lg hover:bg-white/60 transition-colors">
            <Filter className="h-4 w-4" />
            <span className="text-sm">Filtros</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <FileText className="h-8 w-8 text-black/40" />
            </div>
            <p className="text-black/60">Cargando planes...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="font-display text-xl font-semibold text-black mb-2">Error al cargar planes</h3>
            <p className="text-black/60 mb-6">{error}</p>
            <button
              onClick={fetchPlans}
              className="px-6 py-3 text-black hover:text-white hover:bg-[var(--accent-600)] rounded-sm ring-1 ring-transparent hover:ring-[var(--accent-600)]/70 transition-all duration-200 font-medium"
            >
              Reintentar
            </button>
          </div>
        ) : filteredPlans.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPlans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-xl border border-[#E5E5E5] bg-white/60 p-5 hover:shadow-sm transition-shadow cursor-pointer group"
                onClick={() => handleNavigation(`/planes/${plan.id}`)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-display text-lg font-semibold text-black mb-1 group-hover:text-[var(--accent-600)] transition-colors">
                      {plan.name}
                    </h3>
                    <p className="text-sm text-black/70 line-clamp-2">{plan.description || "Sin descripción"}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      // Handle kebab menu
                    }}
                    className="p-1 hover:bg-black/5 rounded transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Más opciones"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-black/60">Progreso</span>
                    <span className="text-sm font-medium text-black">{plan.progress?.overall || 0}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-black/10">
                    <div
                      className="h-2 rounded-full bg-[#D66770] transition-all duration-300"
                      style={{ width: `${plan.progress?.overall || 0}%` }}
                    />
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {getStatusBadge(plan.status)}
                  {plan.start_date && plan.end_date && (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 border border-blue-200 rounded-full flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(plan.start_date).toLocaleDateString("es-ES", { month: "short", day: "numeric" })} -{" "}
                      {new Date(plan.end_date).toLocaleDateString("es-ES", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>

                {/* Channels */}
                {plan.channels && plan.channels.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-black/60">Canales:</span>
                    <div className="flex gap-1">
                      {plan.channels.map((channel: string) => (
                        <span key={channel} className="text-sm" title={channel}>
                          {getChannelIcon(channel)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-black/40" />
            </div>
            <h3 className="font-display text-xl font-semibold text-black mb-2">
              {searchQuery ? "No se encontraron planes" : "Crea tu primer plan"}
            </h3>
            <p className="text-black/60 mb-6 max-w-sm mx-auto">
              {searchQuery
                ? "Intenta con otros términos de búsqueda"
                : "Los planes son donde tus ideas se transforman en estrategias mágicas ✨"}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="group relative text-base text-black hover:text-white hover:bg-[var(--accent-600)] rounded-sm ring-1 ring-transparent hover:ring-[var(--accent-600)]/70 hover:shadow-[0_0_0_6px_rgba(138,15,28,0.10)] px-6 py-3 transition-all duration-200 font-medium"
              >
                <Plus className="h-4 w-4 inline mr-2" />
                Crear primer plan
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Plan Modal */}
      {showCreateModal && (
        <CreatePlanModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newPlan) => {
            setPlans((prev) => [newPlan, ...prev])
            setShowCreateModal(false)
            handleNavigation(`/planes/${newPlan.id}`)
          }}
        />
      )}
    </div>
  )
}

function CreatePlanModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (plan: any) => void }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    channels: [] as string[],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const channels = [
    { id: "IG", label: "Instagram", icon: "📷" },
    { id: "YT", label: "YouTube", icon: "📺" },
    { id: "TT", label: "TikTok", icon: "🎵" },
    { id: "LI", label: "LinkedIn", icon: "💼" },
    { id: "X", label: "X (Twitter)", icon: "🐦" },
    { id: "FB", label: "Facebook", icon: "👥" },
    { id: "GEN", label: "General", icon: "📝" },
  ]

  const toggleChannel = (channelId: string) => {
    setFormData((prev) => ({
      ...prev,
      channels: prev.channels.includes(channelId)
        ? prev.channels.filter((c) => c !== channelId)
        : [...prev.channels, channelId],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    try {
      setIsSubmitting(true)
      setError(null)

      const response = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Error al crear plan")
      }

      const newPlan = await response.json()
      onSuccess(newPlan)
    } catch (err) {
      console.error("[v0] Error creating plan:", err)
      setError("Error al crear el plan. Por favor, intenta de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--surface)] rounded-xl border border-[#E5E5E5] w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="font-display text-xl font-semibold text-black mb-4">Crear nuevo plan</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">Nombre del plan *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full bg-white/40 border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-lg px-3 py-2 text-sm transition-colors"
                placeholder="Ej: Campaña Verano 2024"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Objective */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">Objetivo</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full bg-white/40 border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-lg px-3 py-2 text-sm transition-colors"
                placeholder="Ej: Aumentar engagement en redes sociales"
                disabled={isSubmitting}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Fecha inicio</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, start_date: e.target.value }))}
                  className="w-full bg-white/40 border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-lg px-3 py-2 text-sm transition-colors"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">Fecha fin</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
                  className="w-full bg-white/40 border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-lg px-3 py-2 text-sm transition-colors"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Channels */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">Canales</label>
              <div className="flex flex-wrap gap-2">
                {channels.map((channel) => (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => toggleChannel(channel.id)}
                    disabled={isSubmitting}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors disabled:opacity-50 ${
                      formData.channels.includes(channel.id)
                        ? "bg-[var(--accent-600)] text-white border-[var(--accent-600)]"
                        : "bg-white/40 text-black border-[#E5E5E5] hover:bg-white/60"
                    }`}
                  >
                    <span className="mr-1">{channel.icon}</span>
                    {channel.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
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
                {isSubmitting ? "Creando..." : "Crear plan"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
