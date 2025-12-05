"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type AuthMode = "login" | "register"

export default function Auth() {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>("login")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  })
  const [sparkles, setSparkles] = useState<{ [key: string]: boolean }>({})
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const timeoutRefs = useRef<{ [key: string]: NodeJS.Timeout }>({})

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleInputBlur = (field: string, value: string) => {
    if (value.trim() && !sparkles[field]) {
      setSparkles((prev) => ({ ...prev, [field]: true }))

      if (timeoutRefs.current[field]) {
        clearTimeout(timeoutRefs.current[field])
      }

      timeoutRefs.current[field] = setTimeout(() => {
        setSparkles((prev) => ({ ...prev, [field]: false }))
      }, 650)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      if (mode === "login") {
        console.log("[v0] Attempting login for:", formData.email)
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })
        if (error) throw error
        console.log("[v0] Login successful, redirecting to dashboard")
        router.push("/dashboard")
      } else {
        console.log("[v0] Attempting registration for:", formData.email)
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
            data: {
              name: formData.name,
            },
          },
        })
        if (error) throw error

        console.log("[v0] Registration successful")
        setError(null)
        alert("¡Cuenta creada! Por favor revisa tu correo para confirmar tu cuenta.")
        setMode("login")
      }
    } catch (err: any) {
      console.log("[v0] Auth error:", err.message)
      let errorMessage = "Ocurrió un error. Intenta de nuevo."
      if (err.message.includes("Invalid login credentials")) {
        errorMessage = "Correo o contraseña incorrectos."
      } else if (err.message.includes("User already registered")) {
        errorMessage = "Este correo ya está registrado."
      } else if (err.message.includes("Password should be at least")) {
        errorMessage = "La contraseña debe tener al menos 6 caracteres."
      }
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f1eb] notebook-enter flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
            </h1>
            <p className="text-sm text-gray-600">
              {mode === "login" ? "Bienvenido de nuevo a tu cuaderno mágico." : "Únete a tu cuaderno mágico."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  onBlur={(e) => handleInputBlur("name", e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-gray-400 focus:ring-0 rounded-md px-3 py-3 text-sm placeholder-gray-500 transition-colors"
                  required
                />
                {sparkles.name && (
                  <Sparkles
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--accent-400)] sparkle-animation"
                    aria-hidden="true"
                  />
                )}
              </div>
            )}

            <div className="relative">
              <input
                type="email"
                placeholder="Correo electrónico"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                onBlur={(e) => handleInputBlur("email", e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-gray-400 focus:ring-0 rounded-md px-3 py-3 text-sm placeholder-gray-500 transition-colors"
                required
              />
              {sparkles.email && (
                <Sparkles
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--accent-400)] sparkle-animation"
                  aria-hidden="true"
                />
              )}
            </div>

            <div className="relative">
              <input
                type="password"
                placeholder="Contraseña"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                onBlur={(e) => handleInputBlur("password", e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-gray-400 focus:ring-0 rounded-md px-3 py-3 text-sm placeholder-gray-500 transition-colors"
                required
              />
              {sparkles.password && (
                <Sparkles
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--accent-400)] sparkle-animation"
                  aria-hidden="true"
                />
              )}
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white rounded-md px-6 py-3 text-sm font-medium transition-colors mt-6"
            >
              {isLoading ? "Cargando..." : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {mode === "login" ? "¿No tienes una cuenta? " : "¿Ya tienes una cuenta? "}
              <button
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="text-gray-900 hover:underline font-medium"
              >
                {mode === "login" ? "Crear cuenta" : "Iniciar sesión"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
