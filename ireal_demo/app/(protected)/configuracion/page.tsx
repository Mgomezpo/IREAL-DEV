"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, User, Bell, Palette, Shield } from "lucide-react"

export default function Configuracion() {
  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleNavigation = (path: string) => {
    setIsTransitioning(true)
    setTimeout(() => {
      router.push(path)
    }, 350)
  }

  const settingsSections = [
    {
      icon: User,
      title: "Perfil",
      description: "Información personal y preferencias",
      href: "/configuracion/perfil",
    },
    {
      icon: Bell,
      title: "Notificaciones",
      description: "Gestiona cómo y cuándo recibir alertas",
      href: "/configuracion/notificaciones",
    },
    {
      icon: Palette,
      title: "Apariencia",
      description: "Personaliza la interfaz del cuaderno",
      href: "/configuracion/apariencia",
    },
    {
      icon: Shield,
      title: "Privacidad",
      description: "Controla la visibilidad de tu contenido",
      href: "/configuracion/privacidad",
    },
  ]

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
            <h1 className="text-2xl md:text-3xl tracking-tight font-semibold font-display text-black">Configuración</h1>
            <p className="text-black/70 mt-1 text-sm md:text-base leading-7">Personaliza tu experiencia mágica</p>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {settingsSections.map((section) => {
            const Icon = section.icon
            return (
              <button
                key={section.href}
                onClick={() => handleNavigation(section.href)}
                className="p-6 bg-white/40 border border-[#E5E5E5] rounded-xl hover:bg-white/60 hover:shadow-sm transition-all text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-black/5 rounded-lg flex items-center justify-center group-hover:bg-[var(--accent-600)]/10 transition-colors">
                    <Icon className="h-5 w-5 text-black/60 group-hover:text-[var(--accent-600)] transition-colors" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-black mb-1">{section.title}</h3>
                    <p className="text-sm text-black/60">{section.description}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
