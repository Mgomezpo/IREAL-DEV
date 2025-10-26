"use client"

import { useRouter } from "next/navigation"
import { Sparkles } from "lucide-react"
import { useState } from "react"
import Image from "next/image"

export default function Landing() {
  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleNavigation = (path: string) => {
    setIsTransitioning(true)
    setTimeout(() => {
      router.push(path)
    }, 350)
  }

  return (
    <div
      className={`min-h-screen bg-[#0E0E0E] grain-texture relative overflow-hidden ${isTransitioning ? "notebook-exit" : "notebook-enter"}`}
    >
      <div className="absolute top-20 right-20 opacity-40">
        <Sparkles className="h-6 w-6 text-white/60" aria-hidden="true" />
      </div>

      {/* Borde interno tipo cuero */}
      <div className="absolute inset-4 rounded-2xl ring-1 ring-white/5" />

      {/* Contenido principal */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
        <div className="mb-6 text-center">
          <div className="relative flex items-center justify-center mb-4">
            {/* SVG Logo */}
            <Image src="/logo-ireal.svg" alt="IREAL Logo" width={120} height={120} className="opacity-90" />
          </div>
          <div className="relative">
            {/* Sombra del logo */}
            <h1 className="font-display text-7xl md:text-9xl font-bold text-black/20 absolute top-1 left-1">IREAL</h1>
            {/* Logo principal */}
            <h1 className="font-display text-7xl md:text-9xl font-bold text-white/90 relative tracking-wider">IREAL</h1>
          </div>
        </div>

        <div className="mb-16 text-center max-w-2xl">
          <p className="text-white/80 text-xl md:text-2xl font-sans leading-relaxed">
            El workspace mágico para Magos del Contenido
          </p>
        </div>

        <div className="flex flex-row gap-6 w-full max-w-md justify-center">
          <button
            onClick={() => handleNavigation("/auth")}
            className="group relative text-base text-white hover:text-white bg-transparent hover:bg-[var(--accent-600)] rounded-sm ring-0 hover:ring-[var(--accent-600)]/70 hover:shadow-[0_0_0_6px_rgba(138,15,28,0.10)] px-8 py-3 transition-all duration-200 font-medium"
          >
            Iniciar sesión
          </button>
          <button
            onClick={() => handleNavigation("/auth")}
            className="group relative text-base text-white hover:text-white bg-transparent hover:bg-[var(--accent-600)] rounded-sm ring-0 hover:ring-[var(--accent-600)]/70 hover:shadow-[0_0_0_6px_rgba(138,15,28,0.10)] px-8 py-3 transition-all duration-200 font-medium"
          >
            Registrarse
          </button>
        </div>
      </div>
    </div>
  )
}
