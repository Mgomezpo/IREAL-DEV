"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Library, Search } from "lucide-react"

export default function Biblioteca() {
  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleNavigation = (path: string) => {
    setIsTransitioning(true)
    setTimeout(() => {
      router.push(path)
    }, 350)
  }

  return (
    <div className={`min-h-screen bg-[var(--surface)] ${isTransitioning ? "notebook-exit" : "notebook-enter"}`}>
      <div className="max-w-4xl mx-auto px-6 py-8">
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
            <h1 className="text-2xl md:text-3xl tracking-tight font-semibold font-display text-black">Biblioteca</h1>
            <p className="text-black/70 mt-1 text-sm md:text-base leading-7">Tu archivo de contenido publicado</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40" />
          <input
            type="text"
            placeholder="Buscar en biblioteca..."
            className="w-full bg-white/40 border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-lg pl-10 pr-4 py-3 text-sm placeholder-black/40 transition-colors"
          />
        </div>

        {/* Empty State */}
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Library className="h-8 w-8 text-black/40" />
          </div>
          <h3 className="font-display text-xl font-semibold text-black mb-2">Tu biblioteca está vacía</h3>
          <p className="text-black/60 mb-6 max-w-sm mx-auto">
            Cuando publiques contenido, aparecerá aquí para que puedas revisarlo y reutilizarlo ✨
          </p>
        </div>
      </div>
    </div>
  )
}
