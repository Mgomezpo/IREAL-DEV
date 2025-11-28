"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  ArrowLeft,
  Share2,
  Download,
  MoreHorizontal,
  Maximize2,
  Minimize2,
  Send,
  Paperclip,
  Sparkles,
  Plus,
  Calendar,
  BarChart3,
  Users,
  Target,
  FileText,
  ChevronRight,
  Save,
  ChevronDown,
  Loader2,
} from "lucide-react"
import { FlipCard } from "@/components/flip-card"
import { ManagePlanNotesModal } from "@/components/manage-plan-notes-modal"

const PLAN_DOC_KEY = (id: string) => `ireal:plans:doc:${id}`

const loadPlanDoc = (id: string) => {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(PLAN_DOC_KEY(id))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// Mock plan data
const mockPlan = {
  id: "1",
  name: "Campaña Verano 2024",
  description: "Estrategia de contenido para la temporada de verano",
  status: "active" as const,
  progress: { doc: 75, schedule: 60, approvals: 40, overall: 65 },
  startDate: "2024-06-01",
  endDate: "2024-08-31",
  channels: ["IG", "YT", "TT"],
  sections: [
    {
      id: "summary",
      title: "Resumen ejecutivo",
      content: "Campaña enfocada en contenido de verano...",
      type: "summary",
    },
    { id: "goals", title: "Objetivos (SMART)", content: "", type: "goals" },
    { id: "audience", title: "Audiencia & ICP", content: "", type: "audience" },
    { id: "messages", title: "Propuesta de valor & Mensajes", content: "", type: "messages" },
    { id: "pillars", title: "Pilares de contenido", content: "", type: "pillars" },
    { id: "calendar", title: "Calendario", content: "", type: "calendar" },
    { id: "backlog", title: "Backlog de piezas", content: "", type: "backlog" },
    { id: "kpis", title: "KPIs & Métricas", content: "", type: "kpis" },
    { id: "resources", title: "Recursos & Presupuesto", content: "", type: "resources" },
    { id: "approvals", title: "Aprobaciones & Notas", content: "", type: "approvals" },
  ],
}

const mockMessages = [
  {
    id: "1",
    role: "assistant" as const,
    content: "¡Hola! Estoy aquí para ayudarte a desarrollar tu campaña de verano. ¿Por dónde te gustaría empezar?",
    createdAt: "2024-05-20T10:00:00Z",
  },
]

type IdeaSummary = {
  id: string
  title: string
  content?: string | null
}

type PlanStrategy = {
  diagnosis?: string
  strategy?: string
  executionPlan?: string
  raw?: unknown
}

export default function PlanWorkspace() {
  const router = useRouter()
  const params = useParams()
  const planId = String(params.id)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isDocumentExpanded, setIsDocumentExpanded] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showBoards, setShowBoards] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [plan, setPlan] = useState<any>(null)
  const [sections, setSections] = useState<any[]>([])
  const [loadingPlan, setLoadingPlan] = useState(true)
  const [savingSection, setSavingSection] = useState<string | null>(null)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [sectionContent, setSectionContent] = useState<{ [key: string]: string }>({})
  const [insertMenuOpen, setInsertMenuOpen] = useState<string | null>(null)
  const [linkedIdeas, setLinkedIdeas] = useState<IdeaSummary[]>([])
  const [loadingIdeas, setLoadingIdeas] = useState(false)
  const [notesModalOpen, setNotesModalOpen] = useState(false)
  const [strategy, setStrategy] = useState<PlanStrategy | null>(null)
  const [strategyLoading, setStrategyLoading] = useState(false)
  const [strategyError, setStrategyError] = useState<string | null>(null)
  const [planDoc, setPlanDoc] = useState<any | null>(null)
  const [docLoading, setDocLoading] = useState(false)
  const [docError, setDocError] = useState<string | null>(null)

  const planDocObject = typeof planDoc === "string" ? { plan: planDoc } : planDoc
  const planDocText = planDocObject?.plan || planDocObject?.plan_text || planDocObject?.content || null

  useEffect(() => {
    loadPlan()
  }, [params.id])

  const loadLinkedIdeas = async () => {
    try {
      setLoadingIdeas(true)
      const response = await fetch(`/api/plans/${planId}/ideas`)
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/auth")
          return
        }
        throw new Error("Error al cargar notas vinculadas")
      }
      const data = (await response.json()) as IdeaSummary[]
      setLinkedIdeas(data ?? [])
    } catch (error) {
      console.error("[v0] Error loading linked ideas:", error)
      setLinkedIdeas([])
    } finally {
      setLoadingIdeas(false)
    }
  }

  const loadPlan = async () => {
    try {
      setStrategy(null)
      setStrategyError(null)
      console.log("[v0] Loading plan:", params.id)
      const response = await fetch(`/api/plans/${params.id}`)

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/auth")
          return
        }
        throw new Error("Error al cargar plan")
      }

      const data = await response.json()
      console.log("[v0] Plan loaded:", data)
      const orderedSections = (data.plan_sections || []).slice().sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
      setPlan({ ...data, plan_sections: orderedSections })
      setSections(orderedSections)

      const docFromApi = (data as any).aiDoc || (data as any).ai_doc || (data as any).plan_doc || null
      const storedDoc = loadPlanDoc(planId)
      const effectiveDoc = docFromApi ?? storedDoc
      setPlanDoc(effectiveDoc)
      if (docFromApi && !storedDoc) {
        try {
          localStorage.setItem(PLAN_DOC_KEY(planId), JSON.stringify(docFromApi))
        } catch (storageError) {
          console.error("[v0] Error persisting plan doc locally", storageError)
        }
      }

      // Initialize section content
      const contentMap: { [key: string]: string } = {}
      orderedSections.forEach((section: any) => {
        contentMap[section.id] = section.content?.text || ""
      })
      setSectionContent(contentMap)

      void loadLinkedIdeas()

      // Initialize chat with welcome message
      setMessages([
        {
          id: "1",
          role: "assistant",
          content: `¡Hola! Estoy aquí para ayudarte a desarrollar "${data.name}". ¿Qué aspecto del plan quieres trabajar primero?`,
          createdAt: new Date().toISOString(),
        },
      ])
    } catch (error) {
      console.error("[v0] Error loading plan:", error)
    } finally {
      setLoadingPlan(false)
    }
  }

  const regenerateStrategy = async () => {
    try {
      setStrategyLoading(true)
      setStrategyError(null)
      const response = await fetch(`/api/plans/${planId}/generate-strategy`, {
        method: "POST",
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/auth")
          return
        }
        throw new Error(`Error al regenerar estrategia (${response.status})`)
      }

      const data = await response.json()
      setStrategy(data ?? null)
    } catch (error) {
      console.error("[v0] Error regenerating strategy:", error)
      setStrategyError("No se pudo regenerar la estrategia. Intenta de nuevo.")
    } finally {
      setStrategyLoading(false)
    }
  }

  const regeneratePlanDoc = async () => {
    if (!plan) return
    try {
      setDocLoading(true)
      setDocError(null)
      const contextNotes = linkedIdeas.map((n) => [n.title, n.content].filter(Boolean).join(" - ")).filter(Boolean)

      const aiResponse = await fetch("/api/ai/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: (plan as any).accountName || plan.name,
          pasion: (plan as any).pasion || "",
          motivacion: (plan as any).motivacion || "",
          conexion: (plan as any).audiencia || (plan as any).target_audience || "",
          vision: (plan as any).vision || plan.description || "",
          tiempo: (plan as any).tiempo || "",
          temas: Array.isArray((plan as any).temas) ? (plan as any).temas : [],
          contextNotes,
        }),
      })

      if (!aiResponse.ok) {
        throw new Error(`Error al regenerar plan (${aiResponse.status})`)
      }

      const aiData = await aiResponse.json()
      const doc = aiData.data || aiData
      setPlanDoc(doc)
      try {
        localStorage.setItem(PLAN_DOC_KEY(planId), JSON.stringify(doc))
      } catch (storageError) {
        console.error("[v0] Error saving regenerated doc locally", storageError)
      }
    } catch (error) {
      console.error("[v0] Error regenerating plan doc", error)
      setDocError("No se pudo regenerar el documento con IA.")
    } finally {
      setDocLoading(false)
    }
  }

  useEffect(() => {
    if (!editingSection) return

    const timeoutId = setTimeout(() => {
      saveSection(editingSection)
    }, 2000)

    return () => clearTimeout(timeoutId)
  }, [sectionContent, editingSection])

  const saveSection = async (sectionId: string) => {
    try {
      setSavingSection(sectionId)
      console.log("[v0] Saving section:", sectionId)

      const content = {
        text: sectionContent[sectionId] || "",
        updatedAt: new Date().toISOString(),
      }

      const response = await fetch(`/api/plans/${params.id}/sections/${sectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/auth")
          return
        }
        throw new Error("Error al guardar sección")
      }

      console.log("[v0] Section saved successfully")

      // Reload plan to update progress
      await loadPlan()
    } catch (error) {
      console.error("[v0] Error saving section:", error)
    } finally {
      setSavingSection(null)
    }
  }

  const handleSectionChange = (sectionId: string, value: string) => {
    setSectionContent((prev) => ({
      ...prev,
      [sectionId]: value,
    }))
    setEditingSection(sectionId)
  }

  const handleNavigation = (path: string) => {
    setIsTransitioning(true)
    setTimeout(() => {
      router.push(path)
    }, 350)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isLoading) return

    const userMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: newMessage,
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setNewMessage("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/ai/plan-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          planContext: {
            name: plan?.name,
            description: plan?.description,
            channels: plan?.channels,
          },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant" as const,
          content: data.content,
          createdAt: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, assistantMessage])
      } else if (response.status === 401) {
        router.push("/auth")
      }
    } catch (error) {
      console.error("[v0] Error sending message:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInsertIntoSection = (messageContent: string, sectionId: string) => {
    setSectionContent((prev) => {
      const currentContent = prev[sectionId] || ""
      const newContent = currentContent ? `${currentContent}\n\n${messageContent}` : messageContent
      return {
        ...prev,
        [sectionId]: newContent,
      }
    })
    setEditingSection(sectionId)
    setInsertMenuOpen(null)
  }

  const toggleBoards = () => {
    setShowBoards(!showBoards)
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (loadingPlan) {
    return (
      <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-600)] mx-auto mb-4" />
          <p className="text-sm text-black/60">Cargando plan...</p>
        </div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-black/60">Plan no encontrado</p>
          <button
            onClick={() => handleNavigation("/planes")}
            className="mt-4 text-sm text-[var(--accent-600)] hover:underline"
          >
            Volver a planes
          </button>
        </div>
      </div>
    )
  }

  if (showBoards) {
    return <PlanBoards plan={plan} onBack={() => setShowBoards(false)} />
  }

  return (
    <div className={`min-h-screen bg-[var(--surface)] ${isTransitioning ? "notebook-exit" : "notebook-enter"}`}>
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-[var(--surface)]/95 backdrop-blur-sm border-b border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleNavigation("/planes")}
              className="p-2 hover:bg-black/5 rounded-lg transition-colors"
              aria-label="Volver a planes"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="flex-1">
              <h1 className="font-display text-lg font-semibold text-black">{plan.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    plan.status === "active"
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : "bg-gray-100 text-gray-800 border border-gray-200"
                  }`}
                >
                  {plan.status === "active" ? "Activo" : "Borrador"}
                </span>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-16 rounded-full bg-black/10">
                    <div
                      className="h-2 rounded-full bg-[#D66770] transition-all duration-300"
                      style={{ width: `${plan.progress?.overall || 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-black/60">{plan.progress?.overall || 0}%</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleBoards}
                className="flex items-center gap-2 px-3 py-2 text-sm text-black hover:bg-black/5 rounded-lg transition-colors"
              >
                <FileText className="h-4 w-4" />
                Hoja de Cuadros
                <ChevronRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => setIsDocumentExpanded(!isDocumentExpanded)}
                className="p-2 hover:bg-black/5 rounded-lg transition-colors"
                aria-label={isDocumentExpanded ? "Contraer documento" : "Expandir documento"}
              >
                {isDocumentExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>

              <button className="p-2 hover:bg-black/5 rounded-lg transition-colors">
                <Share2 className="h-4 w-4" />
              </button>

              <button className="p-2 hover:bg-black/5 rounded-lg transition-colors">
                <Download className="h-4 w-4" />
              </button>

              <button className="p-2 hover:bg-black/5 rounded-lg transition-colors">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Split View */}
      <div className="h-[calc(100vh-80px)]">
        <FlipCard
          frontContent={
            <div className="flex h-full">
              {/* Chat Panel */}
              {!isDocumentExpanded && (
                <div className="w-2/5 border-r border-[#E5E5E5] flex flex-col bg-[var(--surface)]">
                  {/* Chat Header */}
                  <div className="p-4 border-b border-[#E5E5E5]">
                    <h2 className="font-medium text-black mb-2">Chat del plan</h2>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {plan.channels?.length || 0} canales
                      </span>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.role === "user"
                              ? "bg-[var(--accent-600)] text-white"
                              : "bg-white/60 border border-[#E5E5E5] text-black"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          {message.role === "assistant" && (
                            <div className="flex gap-2 mt-2 relative">
                              <button
                                onClick={() => setInsertMenuOpen(insertMenuOpen === message.id ? null : message.id)}
                                className="flex items-center gap-1 text-xs text-black/60 hover:text-black transition-colors"
                              >
                                Insertar en
                                <ChevronDown className="h-3 w-3" />
                              </button>
                              {insertMenuOpen === message.id && (
                                <div className="absolute top-full left-0 mt-1 bg-white border border-[#E5E5E5] rounded-lg shadow-lg py-1 z-10 min-w-[180px]">
                                  {sections.map((section) => (
                                    <button
                                      key={section.id}
                                      onClick={() => handleInsertIntoSection(message.content, section.id)}
                                      className="w-full text-left px-3 py-2 text-xs text-black hover:bg-black/5 transition-colors"
                                    >
                                      {section.title}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white/60 border border-[#E5E5E5] rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 animate-pulse text-[var(--accent-600)]" />
                            <span className="text-sm text-black/60">Generando respuesta...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Chat Input */}
                  <div className="p-4 border-t border-[#E5E5E5]">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <div className="flex-1 relative">
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Escribe tu mensaje..."
                          className="w-full bg-white/40 border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-lg px-3 py-2 text-sm resize-none transition-colors"
                          rows={2}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              handleSendMessage(e)
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="absolute right-2 bottom-2 p-1 hover:bg-black/5 rounded transition-colors"
                        >
                          <Paperclip className="h-4 w-4 text-black/40" />
                        </button>
                      </div>
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || isLoading}
                        className="p-2 bg-[var(--accent-600)] text-white rounded-lg hover:bg-[var(--accent-700)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Document Panel */}
              <div className={`${isDocumentExpanded ? "w-full" : "flex-1"} flex flex-col bg-[var(--surface)]`}>
                {/* Document Header */}
                <div className="p-4 border-b border-[#E5E5E5]">
                  <div className="flex items-center justify-between">
                    <h2 className="font-medium text-black">Documento del plan</h2>
                    {savingSection && (
                      <div className="flex items-center gap-2 text-xs text-black/60">
                        <Save className="h-3 w-3 animate-pulse" />
                        Guardando...
                      </div>
                    )}
                  </div>
                </div>

                {/* Document Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="rounded-xl border border-[#E5E5E5] bg-white/60 p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-display text-lg font-semibold text-black">Documento generado con IA</h3>
                        <p className="text-sm text-black/60">Texto estratégico creado al generar el plan.</p>
                      </div>
                      <button
                        onClick={() => void regeneratePlanDoc()}
                        disabled={docLoading}
                        className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-white bg-[var(--accent-600)] hover:bg-[var(--accent-700)] transition-colors disabled:opacity-50"
                      >
                        {docLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Regenerar con IA
                      </button>
                    </div>
                    {docError && (
                      <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">{docError}</div>
                    )}
                    {planDocObject ? (
                      <div className="space-y-3 text-sm text-black/70">
                        {planDocText ? (
                          <p className="whitespace-pre-line">{planDocText}</p>
                        ) : (
                          <pre className="text-xs bg-black/5 rounded-lg p-3 overflow-x-auto">
                            {JSON.stringify(planDocObject, null, 2)}
                          </pre>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-[#E5E5E5] bg-white/40 p-4 text-sm text-black/60">
                        No hay documento generado para este plan todavía.
                        <div className="mt-3">
                          <button
                            onClick={() => void regeneratePlanDoc()}
                            disabled={docLoading}
                            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-white bg-[var(--accent-600)] hover:bg-[var(--accent-700)] transition-colors disabled:opacity-50"
                          >
                            {docLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Regenerar con IA
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {sections.map((section) => (
                    <div key={section.id} className="rounded-xl border border-[#E5E5E5] bg-white/60 p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-display text-lg font-semibold text-black">{section.title}</h3>
                        <div className="flex gap-2">
                          <button className="p-1 hover:bg-black/5 rounded transition-colors">
                            <Sparkles className="h-4 w-4 text-[var(--accent-600)]" />
                          </button>
                          <button className="p-1 hover:bg-black/5 rounded transition-colors">
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <textarea
                        value={sectionContent[section.id] || ""}
                        onChange={(e) => handleSectionChange(section.id, e.target.value)}
                        placeholder="Escribe aquí el contenido de esta sección..."
                        className="w-full min-h-[150px] bg-white/40 border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-lg px-3 py-2 text-sm resize-y transition-colors"
                      />
                    </div>
                  ))}
                  <div className="rounded-xl border border-[#E5E5E5] bg-white/60 p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-display text-lg font-semibold text-black">Contexto / Notas vinculadas</h3>
                        <p className="text-sm text-black/60">
                          Las notas vinculadas alimentan la estrategia de IA para este plan.
                        </p>
                      </div>
                      <button
                        onClick={() => setNotesModalOpen(true)}
                        className="px-3 py-2 text-xs font-medium rounded-lg border border-[var(--accent-600)]/40 text-[var(--accent-700)] hover:border-[var(--accent-600)] hover:bg-[var(--accent-600)]/10 transition-colors"
                      >
                        Gestionar notas
                      </button>
                    </div>
                    {loadingIdeas ? (
                      <div className="flex items-center gap-2 text-sm text-black/60">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Cargando notas vinculadas...
                      </div>
                    ) : linkedIdeas.length === 0 ? (
                      <p className="text-sm text-black/50">Aún no hay notas vinculadas.</p>
                    ) : (
                      <div className="space-y-2">
                        {linkedIdeas.map((idea) => (
                          <button
                            key={idea.id}
                            className="w-full text-left rounded-lg border border-[#E5E5E5] bg-white/70 px-3 py-2 hover:border-[var(--accent-600)]/40 hover:bg-[var(--accent-600)]/5 transition-colors"
                            onClick={() => router.push(`/ideas/${idea.id}`)}
                          >
                            <p className="text-sm font-medium text-black">{idea.title || "Idea sin título"}</p>
                            {idea.content && (
                              <p className="text-xs text-black/60 line-clamp-2 whitespace-pre-line">{idea.content}</p>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-[#E5E5E5] bg-white/60 p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-display text-lg font-semibold text-black">Estrategia generada por IA</h3>
                        <p className="text-sm text-black/60">
                          Diagnóstico, estrategia y plan de ejecución basados en el plan y sus notas.
                        </p>
                      </div>
                      <button
                        onClick={() => void regenerateStrategy()}
                        disabled={strategyLoading}
                        className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-white bg-[var(--accent-600)] hover:bg-[var(--accent-700)] transition-colors disabled:opacity-50"
                      >
                        {strategyLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Regenerar Estrategia
                      </button>
                    </div>
                    {strategyError && (
                      <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">{strategyError}</div>
                    )}
                    {strategy ? (
                      <div className="space-y-4">
                        {strategy.diagnosis && (
                          <div>
                            <h4 className="text-sm font-semibold text-black">Diagnosis</h4>
                            <p className="text-sm text-black/70 whitespace-pre-line">{strategy.diagnosis}</p>
                          </div>
                        )}
                        {strategy.strategy && (
                          <div>
                            <h4 className="text-sm font-semibold text-black">Strategy</h4>
                            <p className="text-sm text-black/70 whitespace-pre-line">{strategy.strategy}</p>
                          </div>
                        )}
                        {strategy.executionPlan && (
                          <div>
                            <h4 className="text-sm font-semibold text-black">Execution</h4>
                            <p className="text-sm text-black/70 whitespace-pre-line">{strategy.executionPlan}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-black/50">
                        Aún no se ha generado la estrategia. Usa "Regenerar Estrategia" para obtenerla con el contexto
                        actualizado.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          }
          backContent={
            <div className="h-full overflow-y-auto bg-[var(--surface)] p-8">
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="rounded-xl border border-[#E5E5E5] bg-white/60 p-6">
                  <h2 className="font-display text-2xl font-semibold text-black mb-4">{plan.name}</h2>
                  <p className="text-black/60 mb-6">{plan.description}</p>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Objetivo */}
                    <div>
                      <h3 className="flex items-center gap-2 font-medium text-black mb-3">
                        <Target className="h-5 w-5 text-[var(--accent-600)]" />
                        Objetivo
                      </h3>
                      <p className="text-sm text-black/70">{plan.description || "No definido"}</p>
                    </div>

                    {/* Calendario */}
                    <div>
                      <h3 className="flex items-center gap-2 font-medium text-black mb-3">
                        <Calendar className="h-5 w-5 text-[var(--accent-600)]" />
                        Calendario
                      </h3>
                      <div className="text-sm text-black/70">
                        {plan.start_date && plan.end_date ? (
                          <>
                            <p>Inicio: {new Date(plan.start_date).toLocaleDateString("es-ES")}</p>
                            <p>Fin: {new Date(plan.end_date).toLocaleDateString("es-ES")}</p>
                          </>
                        ) : (
                          <p>No definido</p>
                        )}
                      </div>
                    </div>

                    {/* Redes sociales */}
                    <div>
                      <h3 className="flex items-center gap-2 font-medium text-black mb-3">
                        <Users className="h-5 w-5 text-[var(--accent-600)]" />
                        Redes sociales
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {plan.channels && plan.channels.length > 0 ? (
                          plan.channels.map((channel: string) => (
                            <span
                              key={channel}
                              className="px-3 py-1 text-xs rounded-full bg-[var(--accent-600)]/10 text-[var(--accent-600)] border border-[var(--accent-600)]/20"
                            >
                              {channel}
                            </span>
                          ))
                        ) : (
                          <p className="text-sm text-black/40">No definidas</p>
                        )}
                      </div>
                    </div>

                    {/* Progreso */}
                    <div>
                      <h3 className="flex items-center gap-2 font-medium text-black mb-3">
                        <BarChart3 className="h-5 w-5 text-[var(--accent-600)]" />
                        Progreso
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-xs text-black/60 mb-1">
                            <span>Documento</span>
                            <span>{plan.progress?.doc || 0}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-black/10">
                            <div
                              className="h-2 rounded-full bg-[#D66770] transition-all"
                              style={{ width: `${plan.progress?.doc || 0}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-black/60 mb-1">
                            <span>Calendario</span>
                            <span>{plan.progress?.schedule || 0}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-black/10">
                            <div
                              className="h-2 rounded-full bg-[#D66770] transition-all"
                              style={{ width: `${plan.progress?.schedule || 0}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-black/60 mb-1">
                            <span>Aprobaciones</span>
                            <span>{plan.progress?.approvals || 0}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-black/10">
                            <div
                              className="h-2 rounded-full bg-[#D66770] transition-all"
                              style={{ width: `${plan.progress?.approvals || 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cuentas conectadas */}
                <div className="rounded-xl border border-[#E5E5E5] bg-white/60 p-6">
                  <h3 className="font-medium text-black mb-4">Cuentas conectadas</h3>
                  <div className="text-center py-8 text-black/40">
                    <p className="text-sm mb-2">No hay cuentas conectadas</p>
                    <button className="text-xs text-[var(--accent-600)] hover:underline">Conectar cuentas</button>
                  </div>
                </div>
              </div>
            </div>
          }
        />
      </div>
      <ManagePlanNotesModal
        planId={planId}
        initialSelectedIds={linkedIdeas.map((idea) => idea.id)}
        open={notesModalOpen}
        onClose={() => setNotesModalOpen(false)}
        onSaved={(ideas) => {
          setLinkedIdeas(ideas)
          setNotesModalOpen(false)
          void loadLinkedIdeas()
        }}
      />
    </div>
  )
}

function PlanBoards({ plan, onBack }: { plan: any; onBack: () => void }) {
  const [formData, setFormData] = useState({
    mainGoal: "",
    keyMessages: ["", "", ""],
    startDate: plan.startDate || "",
    endDate: plan.endDate || "",
    frequency: "",
    linkedIdeas: [],
    targetAccounts: [],
    socialNetworks: plan.channels || [],
    kpis: {
      reach: "",
      followers: "",
      conversions: "",
      postsPerWeek: "",
    },
  })

  const socialNetworks = [
    { id: "IG", label: "Instagram", icon: "📷" },
    { id: "YT", label: "YouTube", icon: "📺" },
    { id: "TT", label: "TikTok", icon: "🎵" },
    { id: "LI", label: "LinkedIn", icon: "💼" },
    { id: "X", label: "X (Twitter)", icon: "🐦" },
    { id: "FB", label: "Facebook", icon: "👥" },
  ]

  const toggleNetwork = (networkId: string) => {
    setFormData((prev) => ({
      ...prev,
      socialNetworks: prev.socialNetworks.includes(networkId)
        ? prev.socialNetworks.filter((n) => n !== networkId)
        : [...prev.socialNetworks, networkId],
    }))
  }

  return (
    <div className="min-h-screen bg-[var(--surface)] notebook-enter">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--surface)]/95 backdrop-blur-sm border-b border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-black/5 rounded-lg transition-colors"
              aria-label="Volver al workspace"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="flex-1">
              <h1 className="font-display text-lg font-semibold text-black">Hoja de Cuadros</h1>
              <p className="text-sm text-black/60">{plan.name}</p>
            </div>

            <div className="flex gap-2">
              <button className="px-4 py-2 text-sm text-black hover:text-white hover:bg-[var(--accent-600)] rounded-lg ring-1 ring-transparent hover:ring-[var(--accent-600)]/70 transition-all duration-200 font-medium">
                Guardar
              </button>
              <button className="px-4 py-2 text-sm text-black bg-white/40 border border-[#E5E5E5] rounded-lg hover:bg-white/60 transition-colors">
                Compartir
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-12 gap-6">
          {/* A) Objetivos - col-span-7 */}
          <div className="lg:col-span-7 rounded-xl border border-[#E5E5E5] bg-white/60 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold text-black flex items-center gap-2">
                <Target className="h-5 w-5 text-[var(--accent-600)]" />
                Objetivos
              </h2>
              <div className="flex gap-2">
                <button className="p-1 hover:bg-black/5 rounded transition-colors">
                  <Sparkles className="h-4 w-4 text-[var(--accent-600)]" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Meta principal</label>
                <textarea
                  value={formData.mainGoal}
                  onChange={(e) => setFormData((prev) => ({ ...prev, mainGoal: e.target.value }))}
                  className="w-full bg-white/40 border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-lg px-3 py-2 text-sm transition-colors"
                  rows={3}
                  placeholder="Describe el objetivo principal de este plan..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Mensajes clave</label>
                {formData.keyMessages.map((message, index) => (
                  <input
                    key={index}
                    type="text"
                    value={message}
                    onChange={(e) => {
                      const newMessages = [...formData.keyMessages]
                      newMessages[index] = e.target.value
                      setFormData((prev) => ({ ...prev, keyMessages: newMessages }))
                    }}
                    className="w-full mb-2 bg-white/40 border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-lg px-3 py-2 text-sm transition-colors"
                    placeholder={`Mensaje clave ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* B) Calendario - col-span-5 */}
          <div className="lg:col-span-5 rounded-xl border border-[#E5E5E5] bg-white/60 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold text-black flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[var(--accent-600)]" />
                Calendario
              </h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Inicio</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                    className="w-full bg-white/40 border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-lg px-3 py-2 text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Fin</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                    className="w-full bg-white/40 border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-lg px-3 py-2 text-sm transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Frecuencia</label>
                <input
                  type="text"
                  value={formData.frequency}
                  onChange={(e) => setFormData((prev) => ({ ...prev, frequency: e.target.value }))}
                  className="w-full bg-white/40 border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-lg px-3 py-2 text-sm transition-colors"
                  placeholder="Ej: 3 posts/semana"
                />
              </div>

              <button className="w-full px-4 py-2 text-sm text-black hover:text-white hover:bg-[var(--accent-600)] rounded-lg ring-1 ring-transparent hover:ring-[var(--accent-600)]/70 transition-all duration-200 font-medium">
                Generar calendario
              </button>
            </div>
          </div>

          {/* C) Ideas vinculadas - col-span-4 */}
          <div className="lg:col-span-4 rounded-xl border border-[#E5E5E5] bg-white/60 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold text-black flex items-center gap-2">
                <FileText className="h-5 w-5 text-[var(--accent-600)]" />
                Ideas vinculadas
              </h2>
              <button className="p-1 hover:bg-black/5 rounded transition-colors">
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="text-center py-8 text-black/40">
              <p className="text-sm mb-2">No hay ideas vinculadas</p>
              <button className="text-xs text-[var(--accent-600)] hover:underline">+ Vincular ideas</button>
            </div>
          </div>

          {/* D) Cuentas y Redes - col-span-4 */}
          <div className="lg:col-span-4 rounded-xl border border-[#E5E5E5] bg-white/60 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold text-black flex items-center gap-2">
                <Users className="h-5 w-5 text-[var(--accent-600)]" />
                Cuentas y Redes
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Redes sociales</label>
                <div className="flex flex-wrap gap-2">
                  {socialNetworks.map((network) => (
                    <button
                      key={network.id}
                      onClick={() => toggleNetwork(network.id)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        formData.socialNetworks.includes(network.id)
                          ? "bg-[var(--accent-600)] text-white border-[var(--accent-600)]"
                          : "bg-white/40 text-black border-[#E5E5E5] hover:bg-white/60"
                      }`}
                    >
                      <span className="mr-1">{network.icon}</span>
                      {network.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Cuentas destino</label>
                <div className="text-center py-4 text-black/40">
                  <p className="text-sm mb-2">No hay cuentas conectadas</p>
                  <button className="text-xs text-[var(--accent-600)] hover:underline">Conectar cuentas</button>
                </div>
              </div>
            </div>
          </div>

          {/* E) KPIs - col-span-4 */}
          <div className="lg:col-span-4 rounded-xl border border-[#E5E5E5] bg-white/60 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold text-black flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[var(--accent-600)]" />
                KPIs
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Alcance meta</label>
                <input
                  type="text"
                  value={formData.kpis.reach}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      kpis: { ...prev.kpis, reach: e.target.value },
                    }))
                  }
                  className="w-full bg-white/40 border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-lg px-3 py-2 text-sm transition-colors"
                  placeholder="Ej: 100,000 impresiones"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Seguidores nuevos</label>
                <input
                  type="text"
                  value={formData.kpis.followers}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      kpis: { ...prev.kpis, followers: e.target.value },
                    }))
                  }
                  className="w-full bg-white/40 border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-lg px-3 py-2 text-sm transition-colors"
                  placeholder="Ej: 500 seguidores"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Leads/Conversiones</label>
                <input
                  type="text"
                  value={formData.kpis.conversions}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      kpis: { ...prev.kpis, conversions: e.target.value },
                    }))
                  }
                  className="w-full bg-white/40 border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-lg px-3 py-2 text-sm transition-colors"
                  placeholder="Ej: 50 leads"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Publicaciones/semana</label>
                <input
                  type="text"
                  value={formData.kpis.postsPerWeek}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      kpis: { ...prev.kpis, postsPerWeek: e.target.value },
                    }))
                  }
                  className="w-full bg-white/40 border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-lg px-3 py-2 text-sm transition-colors"
                  placeholder="Sugerido por IA"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
