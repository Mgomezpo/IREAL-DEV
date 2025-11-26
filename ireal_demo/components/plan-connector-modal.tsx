"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Loader2, Plus, X } from "lucide-react"
import { useRouter } from "next/navigation"

interface PlanRecord {
  id: string
  name: string
  status?: string
  channels?: string[]
  progress?: { overall?: number }
}

interface PlanConnectorModalProps {
  ideaId: string | null
  ideaTitle?: string
  open: boolean
  onClose: () => void
  onAttached?: () => void
}

export function PlanConnectorModal({ ideaId, ideaTitle, open, onClose, onAttached }: PlanConnectorModalProps) {
  const router = useRouter()
  const [plans, setPlans] = useState<PlanRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [attachingId, setAttachingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/plans")
      if (!response.ok) {
        throw new Error(`Error ${response.status}`)
      }
      const data = (await response.json()) as PlanRecord[]
      setPlans(data ?? [])
    } catch (err) {
      console.error("[plan-connector] Error loading plans", err)
      setError("No se pudieron cargar los planes.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      fetchPlans()
    }
  }, [open, fetchPlans])

  const attachPlan = async (planId: string) => {
    if (!ideaId) return
    setAttachingId(planId)
    try {
      const response = await fetch(`/api/ideas/${ideaId}/attach-plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planIds: [planId] }),
      })
      if (!response.ok) {
        throw new Error("Failed to attach plan")
      }
      console.info("[plan-connector] Plan attached", { ideaId, planId })
      onAttached?.()
      onClose()
    } catch (err) {
      console.error("[plan-connector] Failed to attach plan", err)
      setError("No se pudo conectar el plan. Intenta de nuevo.")
    } finally {
      setAttachingId(null)
    }
  }

  const cards = useMemo(() => plans.slice(0, 5), [plans])

  return (
    <Dialog.Root open={open} onOpenChange={(val) => (!val ? onClose() : null)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 z-40" />
        <Dialog.Content className="fixed inset-x-0 top-1/2 z-50 mx-auto w-full max-w-3xl -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl focus:outline-none">
          <div className="flex items-start justify-between mb-4">
            <div>
              <Dialog.Title className="text-xl font-semibold text-black">Conectar plan</Dialog.Title>
              <Dialog.Description className="text-sm text-black/60">
                Elige un plan existente para <strong>{ideaTitle ?? "esta idea"}</strong> o crea uno nuevo.
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-full p-2 text-black/60 hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          {error && <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

          {loading ? (
            <div className="flex items-center justify-center py-16 text-black/60">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Cargando planes...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {cards.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => attachPlan(plan.id)}
                  disabled={!ideaId || attachingId === plan.id}
                  className="flex flex-col rounded-2xl border border-black/10 bg-white/70 p-4 text-left transition hover:border-[var(--accent-600)]/40 hover:shadow-sm disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-base font-semibold text-black">{plan.name}</p>
                    {attachingId === plan.id && <Loader2 className="h-4 w-4 animate-spin text-[var(--accent-600)]" />}
                  </div>
                  <p className="mt-1 text-sm text-black/60 capitalize">{plan.status ?? "borrador"}</p>
                  {plan.channels && plan.channels.length > 0 && (
                    <p className="mt-2 text-xs text-black/50">Canales: {plan.channels.join(", ")}</p>
                  )}
                  {plan.progress?.overall !== undefined && (
                    <p className="mt-2 text-xs text-black/70">Avance: {plan.progress.overall}%</p>
                  )}
                </button>
              ))}
              <button
                onClick={() => {
                  if (!ideaId) return
                  router.push(`/planes/new?linkedIdeaId=${ideaId}`)
                  onClose()
                }}
                disabled={!ideaId}
                className="flex flex-col items-center justify-center rounded-2xl border border-[var(--accent-600)]/40 bg-[var(--accent-600)]/10 p-4 text-center text-[var(--accent-700)] transition hover:border-[var(--accent-600)] hover:bg-[var(--accent-600)]/15 hover:text-[var(--accent-800)] disabled:cursor-not-allowed"
              >
                <Plus className="mb-2 h-5 w-5" />
                Crear nuevo plan a partir de esta nota
              </button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
