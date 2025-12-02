"use client"

import { BarChart3, TrendingUp } from "lucide-react"

export default function Analytics() {
  const isTransitioning = false

  return (
    <div className={`min-h-screen bg-[var(--surface)] ${isTransitioning ? "notebook-exit" : "notebook-enter"}`}>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl tracking-tight font-semibold font-display text-black">Analytics</h1>
            <p className="text-black/70 mt-1 text-sm md:text-base leading-7">
              Métricas que revelan la magia de tu contenido
            </p>
          </div>
        </div>

        <div className="text-center py-12">
          <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="h-8 w-8 text-black/40" />
          </div>
          <h3 className="font-display text-xl font-semibold text-black mb-2">Datos en camino</h3>
          <p className="text-black/60 mb-6 max-w-sm mx-auto">
            Una vez que publiques contenido, aquí verás métricas detalladas de rendimiento ✨
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-black/40">
            <TrendingUp className="h-4 w-4" />
            <span>proximamente en siguientes versiones</span>
          </div>
        </div>
      </div>
    </div>
  )
}
