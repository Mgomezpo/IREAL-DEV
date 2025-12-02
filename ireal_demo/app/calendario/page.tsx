"use client"

import { CalendarCheck2, TrendingUp } from "lucide-react"

export default function Calendario() {
  const isTransitioning = false

  return (
    <div className={`min-h-screen bg-[var(--surface)] ${isTransitioning ? "notebook-exit" : "notebook-enter"}`}>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-black">Calendario</h1>
            <p className="text-black/70 text-sm">Tu cronograma de contenido</p>
          </div>
        </div>

        <div className="text-center py-12">
          <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarCheck2 className="h-8 w-8 text-black/40" />
          </div>
          <h3 className="font-display text-xl font-semibold text-black mb-2">Calendario en camino</h3>
          <p className="text-black/60 mb-6 max-w-sm mx-auto">Pronto podrás planear y ver tus publicaciones aquí.✨</p>
          <div className="flex items-center justify-center gap-2 text-sm text-black/40">
            <TrendingUp className="h-4 w-4" />
            <span>proximamente en siguientes versiones</span>
          </div>
        </div>
      </div>
    </div>
  )
}
