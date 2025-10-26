"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Upload, Calendar, Clock, Sparkles, X, Loader2, Check } from "lucide-react"

export default function NuevaPublicacion() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [selectedDate, setSelectedDate] = useState(searchParams.get("date") || "")
  const [selectedTime, setSelectedTime] = useState("")
  const [title, setTitle] = useState("")
  const [copy, setCopy] = useState("")
  const [script, setScript] = useState("")
  const [targetAudience, setTargetAudience] = useState("")
  const [channel, setChannel] = useState<"IG" | "YT" | "LI" | "X" | "TT" | "FB">("IG")
  const [autopostEnabled, setAutopostEnabled] = useState(true)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedAsset, setUploadedAsset] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleNavigation = (path: string) => {
    setIsTransitioning(true)
    setTimeout(() => {
      router.push(path)
    }, 350)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
    }
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      setUploadedFile(file)
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
    setUploadedAsset(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSave = async (status: "draft" | "scheduled" = "draft") => {
    if (!title || !channel || !selectedDate) {
      alert("Por favor completa los campos requeridos: título, canal y fecha")
      return
    }

    try {
      setSaving(true)

      // Create piece
      const response = await fetch("/api/pieces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          channel,
          status,
          date: selectedDate,
          time: selectedTime || null,
          copy: copy || null,
          script: script || null,
          target_audience: targetAudience || null,
          autopost_enabled: autopostEnabled,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al guardar pieza")
      }

      const { piece } = await response.json()

      // Upload file if present
      if (uploadedFile && piece.id) {
        setUploading(true)
        const formData = new FormData()
        formData.append("file", uploadedFile)

        const uploadResponse = await fetch(`/api/pieces/${piece.id}/assets`, {
          method: "POST",
          body: formData,
        })

        if (uploadResponse.ok) {
          const { asset } = await uploadResponse.json()
          setUploadedAsset(asset)
        }
        setUploading(false)
      }

      // Navigate back to calendar
      handleNavigation("/calendario")
    } catch (error) {
      console.error("[v0] Error saving piece:", error)
      alert("Error al guardar la pieza. Por favor intenta de nuevo.")
    } finally {
      setSaving(false)
    }
  }

  const channelOptions = [
    { value: "IG", label: "Instagram", icon: "📷" },
    { value: "YT", label: "YouTube", icon: "📺" },
    { value: "LI", label: "LinkedIn", icon: "💼" },
    { value: "X", label: "X (Twitter)", icon: "🐦" },
    { value: "TT", label: "TikTok", icon: "🎵" },
    { value: "FB", label: "Facebook", icon: "👥" },
  ]

  return (
    <div className={`min-h-screen bg-[var(--surface)] ${isTransitioning ? "notebook-exit" : "notebook-enter"}`}>
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => handleNavigation("/calendario")}
            className="p-2 hover:bg-black/5 rounded-lg transition-colors"
            aria-label="Volver al calendario"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl tracking-tight font-semibold font-display text-black">
              Nueva Publicación
            </h1>
            <p className="text-black/70 mt-1 text-sm md:text-base leading-7">Crea contenido mágico para tu audiencia</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white/40 border border-[#E5E5E5] rounded-xl">
          {/* Header with Asset Upload */}
          <div className="p-6 border-b border-[#E5E5E5] flex items-start justify-between">
            <div className="flex-1">
              <label className="block text-sm font-medium text-black mb-2">Nombre de la pieza</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Tips para emprendedores"
                className="w-full font-display text-lg font-semibold bg-transparent border border-[#E5E5E5] rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--accent-600)]/20 focus:border-[var(--accent-600)]"
              />
            </div>
            <div className="ml-6">
              <label className="block text-sm font-medium text-black mb-2">Archivo de la pieza</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.mp4,.mov,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              {uploadedFile ? (
                <div className="w-40 h-24 rounded-md border border-[#E5E5E5] bg-white/50 p-3 flex flex-col items-center justify-center text-center relative">
                  <button
                    onClick={removeFile}
                    className="absolute top-1 right-1 p-1 bg-black/10 hover:bg-black/20 rounded-full transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-black/40" />
                  ) : (
                    <>
                      <Check className="h-5 w-5 text-green-600 mb-1" />
                      <span className="text-xs text-black/60 truncate w-full">{uploadedFile.name}</span>
                    </>
                  )}
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleFileDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="w-40 h-24 rounded-md border border-dashed border-[#E5E5E5] bg-white/50 p-3 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/70 transition-colors"
                >
                  <Upload className="h-5 w-5 text-black/40 mb-1" />
                  <span className="text-xs text-black/60">
                    Arrastra tu archivo o <span className="font-medium text-[var(--accent-600)]">Subir</span>
                  </span>
                  <span className="text-xs text-black/40 mt-1">.png .jpg .mp4 .mov .pdf</span>
                </div>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="p-6 grid md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Copy</label>
                <textarea
                  rows={4}
                  value={copy}
                  onChange={(e) => setCopy(e.target.value)}
                  placeholder="Escribe el texto que acompañará tu publicación..."
                  className="w-full px-3 py-2 border border-[#E5E5E5] rounded-lg bg-white/50 text-sm resize-none outline-none focus:ring-2 focus:ring-[var(--accent-600)]/20 focus:border-[var(--accent-600)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">Guion / Script</label>
                <textarea
                  rows={5}
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="Estructura tu contenido con puntos clave..."
                  className="w-full px-3 py-2 border border-[#E5E5E5] rounded-lg bg-white/50 text-sm resize-none outline-none focus:ring-2 focus:ring-[var(--accent-600)]/20 focus:border-[var(--accent-600)]"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Canal</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as any)}
                  className="w-full px-3 py-2 border border-[#E5E5E5] rounded-lg bg-white/50 text-sm outline-none focus:ring-2 focus:ring-[var(--accent-600)]/20 focus:border-[var(--accent-600)]"
                >
                  {channelOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">Público objetivo</label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="Ej: Emprendedores y profesionales"
                  className="w-full px-3 py-2 border border-[#E5E5E5] rounded-lg bg-white/50 text-sm outline-none focus:ring-2 focus:ring-[var(--accent-600)]/20 focus:border-[var(--accent-600)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">Cuenta de referencia</label>
                <select className="w-full px-3 py-2 border border-[#E5E5E5] rounded-lg bg-white/50 text-sm outline-none focus:ring-2 focus:ring-[var(--accent-600)]/20 focus:border-[var(--accent-600)]">
                  <option>@mi_cuenta_principal</option>
                  <option>@cuenta_secundaria</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Fecha</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-3 py-2 border border-[#E5E5E5] rounded-lg bg-white/50 text-sm outline-none focus:ring-2 focus:ring-[var(--accent-600)]/20 focus:border-[var(--accent-600)]"
                    />
                    <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-black/40 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Hora</label>
                  <div className="relative">
                    <input
                      type="time"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full px-3 py-2 border border-[#E5E5E5] rounded-lg bg-white/50 text-sm outline-none focus:ring-2 focus:ring-[var(--accent-600)]/20 focus:border-[var(--accent-600)]"
                    />
                    <Clock className="absolute right-3 top-2.5 h-4 w-4 text-black/40 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-[#E5E5E5] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={autopostEnabled}
                  onChange={(e) => setAutopostEnabled(e.target.checked)}
                  className="rounded"
                />
                <span className="text-black/70">Autopublicar a la hora programada</span>
              </label>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleNavigation("/calendario")}
                className="px-4 py-2 text-sm font-medium text-black/60 hover:text-black transition-colors"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSave("draft")}
                className="px-4 py-2 text-sm font-medium text-black hover:bg-black/5 rounded-lg transition-colors disabled:opacity-50"
                disabled={saving}
              >
                {saving ? "Guardando..." : "Guardar borrador"}
              </button>
              <button
                onClick={() => handleSave("scheduled")}
                className="group relative text-sm text-black hover:text-white hover:bg-[var(--accent-600)] rounded-sm ring-1 ring-transparent hover:ring-[var(--accent-600)]/70 hover:shadow-[0_0_0_6px_rgba(138,15,28,0.10)] px-4 py-2 transition-all duration-200 font-medium disabled:opacity-50"
                disabled={saving}
              >
                <Sparkles className="h-4 w-4 inline mr-2" />
                {saving ? "Programando..." : "Programar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
