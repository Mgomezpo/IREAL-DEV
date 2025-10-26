"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import { NudgeBubble } from "@/components/nudge-bubble"

function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return hash.toString(36)
}

function getCurrentParagraph(element: HTMLDivElement): string {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return ""

  const range = selection.getRangeAt(0)
  let node = range.startContainer

  while (node && node !== element) {
    if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === "P") {
      return (node as HTMLElement).textContent || ""
    }
    node = node.parentNode as Node
  }

  return element.textContent || ""
}

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length
}

function endsWithPunctuation(text: string): boolean {
  const trimmed = text.trim()
  return /[.?!—]$/.test(trimmed)
}

function hasActionVerb(text: string): boolean {
  const actionVerbs = ["quiero", "voy a", "haré", "necesito", "vamos a", "puedo", "debo", "tengo que"]
  const lowerText = text.toLowerCase()
  return actionVerbs.some((verb) => lowerText.includes(verb))
}

interface Idea {
  id: string
  title: string
  description?: string
  channel?: "IG" | "YT" | "X" | "LI" | "GEN"
  priority?: "low" | "medium" | "high"
  status: "active" | "archived"
  pinned: boolean
  linkedPlanIds?: string[]
  createdAt: string
  updatedAt: string
}

export default function IdeaEditor() {
  const router = useRouter()
  const params = useParams()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [idea, setIdea] = useState<Idea | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()

  const [currentNudge, setCurrentNudge] = useState<string | null>(null)
  const [nudgeCount, setNudgeCount] = useState(0)
  const [lastNudgeTime, setLastNudgeTime] = useState<number>(0)
  const [seenParagraphHashes, setSeenParagraphHashes] = useState<Set<string>>(new Set())
  const nudgeTimeoutRef = useRef<NodeJS.Timeout>()
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const isTypingRef = useRef(false)
  const nudgeAbortControllerRef = useRef<AbortController | null>(null)

  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false)
  const [creatingPlan, setCreatingPlan] = useState(false)
  const [planFormData, setPlanFormData] = useState({
    name: "",
    objective: "",
    channels: [] as string[],
  })

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      if (nudgeTimeoutRef.current) {
        clearTimeout(nudgeTimeoutRef.current)
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (nudgeAbortControllerRef.current) {
        nudgeAbortControllerRef.current.abort()
      }
    }
  }, [])

  const checkForNudge = async () => {
    if (!contentRef.current) return

    const now = Date.now()
    const timeSinceLastNudge = now - lastNudgeTime

    if (timeSinceLastNudge < 20000 || nudgeCount >= 5 || isTypingRef.current) {
      return
    }

    const paragraph = getCurrentParagraph(contentRef.current)
    const paragraphHash = hashString(paragraph)

    if (seenParagraphHashes.has(paragraphHash)) {
      return
    }

    const wordCount = countWords(paragraph)
    const titleWordCount = countWords(title)

    const hasMinLength = wordCount >= 12 || (title.trim() && wordCount >= 6)
    const hasPunctuation = endsWithPunctuation(paragraph)
    const hasAction = hasActionVerb(paragraph) || hasActionVerb(title)

    if (!hasMinLength || !hasPunctuation || !hasAction) {
      return
    }

    console.log("[v0] Nudge heuristics passed, requesting nudge...")

    if (nudgeAbortControllerRef.current) {
      nudgeAbortControllerRef.current.abort()
    }

    const abortController = new AbortController()
    nudgeAbortControllerRef.current = abortController

    try {
      const response = await fetch("/api/ai/nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `${title}\n\n${paragraph}`,
        }),
        signal: abortController.signal,
      })

      if (response.status === 204) {
        return
      }

      if (response.ok) {
        const data = await response.json()
        if (data.question) {
          setCurrentNudge(data.question)
          setNudgeCount((prev) => prev + 1)
          setLastNudgeTime(now)
          setSeenParagraphHashes((prev) => new Set(prev).add(paragraphHash))
          console.log("[v0] Nudge received:", data.question)
        }
      }
    } catch (error: unknown) {
      if ((error as Error).name === "AbortError") {
        console.log("[v0] Nudge request cancelled")
      } else {
        console.error("[v0] Error fetching nudge:", error)
      }
    }
  }

  useEffect(() => {
    const fetchIdea = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/ideas/${params.id}`)

        if (response.status === 401 || response.status === 403) {
          console.error("[v0] Unauthorized access, redirecting to auth")
          router.push("/auth")
          return
        }

        if (!response.ok) {
          if (response.status === 404) {
            setError("not_found")
          } else {
            setError("error")
          }
          setLoading(false)
          return
        }

        const data = await response.json()
        setIdea(data)
        setTitle(data.title)
        setContent(data.description || "")
        if (contentRef.current) {
          contentRef.current.textContent = data.description || ""
        }
        setLastSaved(new Date(data.updated_at))
        setLoading(false)
      } catch (err) {
        console.error("[v0] Error fetching idea:", err)
        setError("error")
        setLoading(false)
      }
    }

    fetchIdea()
  }, [params.id, router])

  const handleNavigation = (path: string) => {
    setIsTransitioning(true)
    setTimeout(() => {
      router.push(path)
    }, 350)
  }

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      handleSave(content, newTitle)
    }, 2000)
  }

  const handleContentChange = (newContent: string) => {
    setContent(newContent)

    isTypingRef.current = true

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    if (nudgeTimeoutRef.current) {
      clearTimeout(nudgeTimeoutRef.current)
    }

    if (nudgeAbortControllerRef.current) {
      nudgeAbortControllerRef.current.abort()
    }

    // Autosave logic
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      handleSave(newContent, title)
    }, 2000)

    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false
    }, 1200)

    nudgeTimeoutRef.current = setTimeout(() => {
      checkForNudge()
    }, 1200)
  }

  const handleSave = async (contentToSave: string, titleToSave: string) => {
    setSaving(true)

    try {
      const response = await fetch(`/api/ideas/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleToSave, description: contentToSave }),
      })

      if (response.status === 401 || response.status === 403) {
        console.error("[v0] Unauthorized access, redirecting to auth")
        router.push("/auth")
        return
      }

      if (response.ok) {
        const data = await response.json()
        const now = new Date()
        setLastSaved(now)
        if (idea) {
          setIdea({ ...idea, title: titleToSave, description: contentToSave, updatedAt: data.updated_at })
        }
        console.log("[v0] Idea auto-saved successfully")
      }
    } catch (error) {
      console.error("[v0] Error saving idea:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta idea?")) {
      return
    }

    try {
      const response = await fetch(`/api/ideas/${params.id}`, {
        method: "DELETE",
      })

      if (response.status === 401 || response.status === 403) {
        console.error("[v0] Unauthorized access, redirecting to auth")
        router.push("/auth")
        return
      }

      if (response.ok) {
        console.log("[v0] Idea deleted successfully")
        handleNavigation("/ideas")
      } else {
        alert("Error al eliminar la idea")
      }
    } catch (error) {
      console.error("[v0] Error deleting idea:", error)
      alert("Error al eliminar la idea")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        e.preventDefault()
        document.execCommand("insertLineBreak")
      } else {
        e.preventDefault()
        document.execCommand("insertParagraph")
      }
    }
  }

  const handleContentInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.textContent || ""
    handleContentChange(newContent)
  }

  const openAttachToPlanModal = () => {
    console.log("[v0] Opening attach to plan modal")
  }

  const handleInsertNudge = () => {
    if (!currentNudge || !contentRef.current) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      // If no selection, append to the end
      const newContent = content + (content.endsWith("\n") ? "" : "\n") + `  • ${currentNudge}\n`
      setContent(newContent)
      if (contentRef.current) {
        contentRef.current.textContent = newContent
      }
    } else {
      // Insert at current cursor position
      const range = selection.getRangeAt(0)
      const textNode = document.createTextNode(`\n  • ${currentNudge}\n`)
      range.insertNode(textNode)

      // Update content state
      const newContent = contentRef.current.textContent || ""
      setContent(newContent)
    }

    // Dismiss the nudge after inserting
    setCurrentNudge(null)

    // Trigger autosave
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      handleSave(contentRef.current?.textContent || "", title)
    }, 500)
  }

  const openCreatePlanModal = () => {
    setPlanFormData({
      name: title || "Plan sin título",
      objective: content.substring(0, 200) || "",
      channels: [],
    })
    setShowCreatePlanModal(true)
  }

  const handleCreatePlan = async () => {
    if (!planFormData.name.trim()) {
      alert("Por favor ingresa un nombre para el plan")
      return
    }

    setCreatingPlan(true)

    try {
      const response = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: planFormData.name,
          description: planFormData.objective,
          channels: planFormData.channels,
          status: "draft",
        }),
      })

      if (response.status === 401 || response.status === 403) {
        router.push("/auth")
        return
      }

      if (!response.ok) {
        throw new Error("Error al crear plan")
      }

      const newPlan = await response.json()

      const linkResponse = await fetch(`/api/ideas/${params.id}/attach-plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planIds: [newPlan.id] }),
      })

      if (!linkResponse.ok) {
        console.error("[v0] Error linking idea to plan")
      }

      router.push(`/planes/${newPlan.id}`)
    } catch (error) {
      console.error("[v0] Error creating plan:", error)
      alert("Error al crear el plan")
    } finally {
      setCreatingPlan(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--surface)]">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="animate-pulse" role="status" aria-live="polite" aria-label="Cargando idea">
            <div className="h-8 bg-black/5 rounded w-32 mb-8"></div>
            <div className="h-12 bg-black/5 rounded w-3/4 mb-6"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-black/5 rounded w-full"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error === "not_found" || !idea) {
    return (
      <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-xl font-semibold text-black mb-2">Idea no encontrada</h2>
          <p className="text-black/60 mb-4">Esta idea no existe o no tienes permiso para verla.</p>
          <button onClick={() => handleNavigation("/ideas")} className="text-[var(--accent-600)] hover:underline">
            Volver a Ideas
          </button>
        </div>
      </div>
    )
  }

  if (error === "error") {
    return (
      <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-xl font-semibold text-black mb-2">Error al cargar la idea</h2>
          <p className="text-black/60 mb-4">Hubo un problema al cargar esta idea. Por favor, intenta de nuevo.</p>
          <button onClick={() => handleNavigation("/ideas")} className="text-[var(--accent-600)] hover:underline">
            Volver a Ideas
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-[var(--surface)} ${isTransitioning ? "notebook-exit" : "notebook-enter"}`}>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {saving && "Guardando cambios"}
          {!saving && lastSaved && `Guardado hace ${Math.floor((Date.now() - lastSaved.getTime()) / 1000)} segundos`}
        </div>

        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => handleNavigation("/ideas")}
            className="p-2 hover:bg-black/5 rounded-lg transition-colors"
            aria-label="Volver a Ideas"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={handleDelete}
              className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
              aria-label="Eliminar idea"
              title="Eliminar idea"
            >
              <Trash2 className="h-5 w-5" />
            </button>

            <div className="text-right" aria-live="polite">
              {saving && <div className="text-xs text-[var(--accent-600)]">Guardando...</div>}
              {!saving && lastSaved && (
                <div className="text-xs text-black/40">
                  Guardado hace {Math.floor((Date.now() - lastSaved.getTime()) / 1000)}s
                </div>
              )}
            </div>
          </div>
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Escribe un título…"
          className="w-full bg-transparent border-none outline-none text-4xl md:text-5xl font-semibold font-display tracking-tight text-black placeholder-black/30 mb-8 focus:ring-0"
        />

        <div className="relative">
          <div
            ref={contentRef}
            contentEditable
            onInput={handleContentInput}
            onKeyDown={handleKeyDown}
            className="w-full min-h-[400px] bg-transparent border-none outline-none text-base leading-7 text-black focus:ring-0 empty:before:content-[attr(data-placeholder)] empty:before:text-black/30"
            style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: "1.75" }}
            data-placeholder="Empieza a escribir tus ideas aquí..."
            role="textbox"
            aria-multiline="true"
            suppressContentEditableWarning={true}
          />

          {currentNudge && (
            <NudgeBubble
              question={currentNudge}
              onDismiss={() => {
                setCurrentNudge(null)
              }}
              onInsert={handleInsertNudge}
              onRegenerate={checkForNudge}
            />
          )}
        </div>

        {idea.linkedPlanIds && idea.linkedPlanIds.length > 0 && (
          <div className="mt-6 pt-4 border-t border-[#E5E5E5]">
            <p className="text-sm text-black/60 mb-2">Vinculada a:</p>
            <div className="flex flex-wrap gap-2">
              {idea.linkedPlanIds.map((planId) => (
                <span
                  key={planId}
                  className="text-xs px-2 py-1 rounded-full bg-[var(--accent-600)]/10 text-[var(--accent-600)] cursor-pointer hover:bg-[var(--accent-600)]/20 transition-colors"
                  onClick={() => router.push(`/planes/${planId}`)}
                >
                  Plan #{planId}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {showCreatePlanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface)] rounded-xl border border-[#E5E5E5] p-6 max-w-md w-full">
            <h2 className="font-display text-xl font-semibold text-black mb-4">Crear plan desde idea</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Nombre del plan</label>
                <input
                  type="text"
                  value={planFormData.name}
                  onChange={(e) => setPlanFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-white/40 border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-lg px-3 py-2 text-sm transition-colors"
                  placeholder="Nombre del plan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Objetivo</label>
                <textarea
                  value={planFormData.objective}
                  onChange={(e) => setPlanFormData((prev) => ({ ...prev, objective: e.target.value }))}
                  className="w-full bg-white/40 border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-lg px-3 py-2 text-sm transition-colors"
                  rows={3}
                  placeholder="Describe el objetivo del plan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Canales (opcional)</label>
                <div className="flex flex-wrap gap-2">
                  {["IG", "YT", "TT", "LI", "X", "FB"].map((channel) => (
                    <button
                      key={channel}
                      onClick={() => {
                        setPlanFormData((prev) => ({
                          ...prev,
                          channels: prev.channels.includes(channel)
                            ? prev.channels.filter((c) => c !== channel)
                            : [...prev.channels, channel],
                        }))
                      }}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                        planFormData.channels.includes(channel)
                          ? "bg-[var(--accent-600)] text-white border-[var(--accent-600)]"
                          : "bg-white/40 text-black border-[#E5E5E5] hover:bg-white/60"
                      }`}
                    >
                      {channel}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreatePlanModal(false)}
                disabled={creatingPlan}
                className="flex-1 px-4 py-2 text-sm text-black bg-white/40 border border-[#E5E5E5] rounded-lg hover:bg-white/60 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreatePlan}
                disabled={creatingPlan}
                className="flex-1 px-4 py-2 text-sm text-white bg-[var(--accent-600)] rounded-lg hover:bg-[var(--accent-700)] transition-colors disabled:opacity-50"
              >
                {creatingPlan ? "Creando..." : "Crear plan"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[var(--surface)] via-[var(--surface)]/95 to-transparent p-6">
        <div className="max-w-4xl mx-auto flex justify-center">
          <button
            onClick={openCreatePlanModal}
            className="group relative text-base text-black hover:text-white hover:bg-[var(--accent-600)] rounded-sm ring-1 ring-transparent hover:ring-[var(--accent-600)]/70 hover:shadow-[0_0_0_6px_rgba(138,15,28,0.10)] px-6 py-3 transition-all duration-200 font-medium"
          >
            <Plus className="h-4 w-4 inline mr-2" />
            Crear plan desde esta idea
          </button>
        </div>
      </div>
    </div>
  )
}
