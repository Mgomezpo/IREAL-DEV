"use client"

export default function Workspace() {
  return (
    <div className="min-h-screen bg-[var(--surface)] notebook-enter">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-[var(--ink)] mb-4">
            Tu página de hoy
          </h1>
          <p className="text-[var(--ink)]/70 text-lg leading-relaxed">Convierte tu idea en un hechizo de contenido.</p>
        </div>

        {/* Botones placeholder */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
          <button
            disabled
            className="group relative text-base text-black hover:text-white hover:bg-[var(--accent-600)] rounded-sm ring-1 ring-transparent hover:ring-[var(--accent-600)]/70 hover:shadow-[0_0_0_6px_rgba(138,15,28,0.10)] px-6 py-3 transition-all duration-200 font-medium bg-white border border-[var(--border)] opacity-50 cursor-not-allowed"
          >
            Crear plan
          </button>
          <button
            disabled
            className="group relative text-base text-black hover:text-white hover:bg-[var(--accent-600)] rounded-sm ring-1 ring-transparent hover:ring-[var(--accent-600)]/70 hover:shadow-[0_0_0_6px_rgba(138,15,28,0.10)] px-6 py-3 transition-all duration-200 font-medium bg-white border border-[var(--border)] opacity-50 cursor-not-allowed"
          >
            Generar calendario
          </button>
        </div>

        {/* Mensaje de placeholder */}
        <div className="mt-12 text-center">
          <p className="text-[var(--ink)]/50 text-sm">Placeholder del workspace - Flujo 0 completado ✨</p>
        </div>
      </div>
    </div>
  )
}
