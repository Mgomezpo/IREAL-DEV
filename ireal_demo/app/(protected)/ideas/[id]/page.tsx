"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Trash2 } from "lucide-react"
import { NudgeBubble } from "@/components/nudge-bubble"
import { useAutosaveNote } from "@/hooks/useAutosaveNote"
import { PlanConnectorModal } from "@/components/plan-connector-modal"

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
  return /[.?!¿¡"]$/.test(trimmed)
}

function hasActionVerb(text: string): boolean {
  const actionVerbs = ["quiero", "voy a", "haré", "necesito", "vamos a", "puedo", "debo", "tengo que"]
  const lowerText = text.toLowerCase()
  return actionVerbs.some((verb) => lowerText.includes(verb))
}

interface Idea {
  id: string
  title: string
  content?: string
  channel?: "IG" | "YT" | "X" | "LI" | "GEN"
  priority?: "low" | "medium" | "high"
  status: "active" | "archived"
  pinned: boolean
  linkedPlanIds?: string[]
  created_at?: string
  updated_at?: string
}

interface PlanSummary {
  id: string
  name: string
}

export default function IdeaEditor() {
  const router = useRouter()
  const params = useParams()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [idea, setIdea] = useState<Idea | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const [currentNudge, setCurrentNudge] = useState<string | null>(null)
  const [nudgeCount, setNudgeCount] = useState(0)
  const [lastNudgeTime, setLastNudgeTime] = useState<number>(0)
  const [seenParagraphHashes, setSeenParagraphHashes] = useState<Set<string>>(new Set())
  const nudgeTimeoutRef = useRef<NodeJS.Timeout>()
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const isTypingRef = useRef(false)
  const nudgeAbortControllerRef = useRef<AbortController | null>(null)

  const [planConnectorOpen, setPlanConnectorOpen] = useState(false)
  const [connectedPlans, setConnectedPlans] = useState<PlanSummary[]>([])

  const saveNote = useCallback(
    async ({ title, content }: { title: string; content: string }) => {
      const response = await fetch(`/api/ideas/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      })

      if (response.status === 401 || response.status === 403) {
        router.push("/auth")
        throw new Error("unauthorized")
      }

      if (!response.ok) {
        throw new Error(`Failed to save idea (${response.status})`)
      }

      const data = await response.json()
      const savedAt = data.updated_at ? new Date(data.updated_at) : new Date()
      setLastSaved(savedAt)
      setIdea((current) =>
        current ? { ...current, title, content, updated_at: data.updated_at ?? savedAt.toISOString() } : current,
      )
      return data
    },
    [params.id, router],
  )

  const { title, content, status, onTitleChange, onContentChange, setFromServer, flush } = useAutosaveNote({
    noteId: String(params.id),
    initialTitle: "",
    initialContent: "",
    debounceMs: 1000,
    saveNote,
  })
  const isSaving = status === "saving"
  const isSaved = status === "saved"
  const isError = status === "error"

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
    return () => {
      if (nudgeTimeoutRef.current) {
        clearTimeout(nudgeTimeoutRef.current)
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (nudgeAbortControllerRef.current) {
        nudgeAbortControllerRef.current.abort()
      }
      void flush()
    }
  }, [flush])

  const loadConnectedPlans = useCallback(async (planIds: string[]) => {
    if (!planIds || planIds.length === 0) {
      setConnectedPlans([])
      return
    }

    try {
      const response = await fetch("/api/plans")
      if (!response.ok) {
        throw new Error(`Failed to load plans (${response.status})`)
      }
      const data = (await response.json()) as Array<{ id: string; name?: string }>
      const filtered = data.filter((plan) => planIds.includes(plan.id))
      setConnectedPlans(
        filtered.map((plan) => ({
          id: plan.id,
          name: plan.name || `Plan ${plan.id}`,
        })),
      )
    } catch (err) {
      console.error("[v0] Error loading connected plans", err)
      setConnectedPlans(planIds.map((planId) => ({ id: planId, name: `Plan ${planId}` })))
    }
  }, [])

  const fetchIdea = useCallback(
    async (options?: { showLoading?: boolean }) => {
      const showLoading = options?.showLoading ?? true
      try {
        if (showLoading) {
          setLoading(true)
        }
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
          return
        }

        const data = await response.json()
        const safeContent = data.content || ""
        const safeTitle = data.title || ""

        setIdea(data)
        setFromServer({ title: safeTitle, content: safeContent })
        if (contentRef.current) {
          contentRef.current.textContent = safeContent
        }
        setLastSaved(data.updated_at ? new Date(data.updated_at) : new Date())
        await loadConnectedPlans(data.linkedPlanIds ?? [])
      } catch (err) {
        console.error("[v0] Error fetching idea:", err)
        setError("error")
      } finally {
        if (showLoading) {
          setLoading(false)
        } else {
          setLoading(false)
        }
      }
    },
    [params.id, router, setFromServer, loadConnectedPlans],
  )

  useEffect(() => {
    void fetchIdea({ showLoading: true })
  }, [fetchIdea])

  const handleNavigation = async (path: string) => {
    await flush()
    setIsTransitioning(true)
    setTimeout(() => {
      router.push(path)
    }, 350)
  }

  const handleTitleChange = (newTitle: string) => {
    onTitleChange(newTitle)
  }

  const handleContentChange = (newContent: string) => {
    onContentChange(newContent)

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

    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false
    }, 1200)

    nudgeTimeoutRef.current = setTimeout(() => {
      checkForNudge()
    }, 1200)
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
        await handleNavigation("/ideas")
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
    setPlanConnectorOpen(true)
  }

  const handleInsertNudge = () => {
    if (!currentNudge || !contentRef.current) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      // If no selection, append to the end
      const newContent = content + (content.endsWith("\n") ? "" : "\n") + `  - ${currentNudge}\n`
      onContentChange(newContent)
      if (contentRef.current) {
        contentRef.current.textContent = newContent
      }
    } else {
      // Insert at current cursor position
      const range = selection.getRangeAt(0)
      const textNode = document.createTextNode(`\n  - ${currentNudge}\n`)
      range.insertNode(textNode)

      // Update content state
      const newContent = contentRef.current.textContent || ""
      onContentChange(newContent)
    }

    // Dismiss the nudge after inserting
    setCurrentNudge(null)

    // Trigger autosave quickly after inserting the nudge
    setTimeout(() => {
      void flush()
    }, 500)
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
  }

  return (
    <div className={`min-h-screen bg-[var(--surface)] ${isTransitioning ? "notebook-exit" : "notebook-enter"}`}>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {isSaving && "Guardando cambios"}
          {isSaved && "Todos los cambios guardados"}
          {isError && "No se pudieron guardar los cambios"}
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
              onClick={openAttachToPlanModal}
              className="flex items-center gap-2 rounded-lg border border-[var(--accent-600)]/40 px-3 py-2 text-sm font-medium text-[var(--accent-700)] ring-1 ring-transparent transition-all duration-200 hover:text-white hover:bg-[var(--accent-600)] hover:border-[var(--accent-600)] hover:ring-[var(--accent-600)]/70 hover:shadow-[0_0_0_6px_rgba(138,15,28,0.10)]"
            >
              Conectar a Plan
            </button>
            <button
              onClick={handleDelete}
              className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
              aria-label="Eliminar idea"
              title="Eliminar idea"
            >
              <Trash2 className="h-5 w-5" />
            </button>

            <div className="text-right" aria-live="polite">
              {isSaving && <div className="text-xs text-[var(--accent-600)]">Guardando...</div>}
              {isError && <div className="text-xs text-red-600">Error al guardar</div>}
              {!isSaving && !isError && isSaved && (
                <div className="text-xs text-black/40">
                  Todos los cambios guardados
                  {lastSaved && ` - ${Math.floor((Date.now() - lastSaved.getTime()) / 1000)}s`}
                </div>
              )}
              {!isSaving && !isError && !isSaved && lastSaved && (
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
          placeholder="Escribe un título..."
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

        {(connectedPlans.length > 0 || (idea.linkedPlanIds?.length ?? 0) > 0) && (
          <div className="mt-6 pt-4 border-t border-[#E5E5E5]">
            <p className="text-sm text-black/60 mb-2">Conectada a:</p>
            <div className="flex flex-wrap gap-2">
              {(connectedPlans.length > 0
                ? connectedPlans
                : (idea.linkedPlanIds ?? []).map((planId) => ({ id: planId, name: `Plan ${planId}` })))
                .map((plan) => (
                  <button
                    key={plan.id}
                    className="text-xs px-2 py-1 rounded-full bg-[var(--accent-600)]/10 text-[var(--accent-600)] hover:bg-[var(--accent-600)]/20 transition-colors"
                    onClick={() => router.push(`/planes/${plan.id}`)}
                  >
                    {plan.name}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      <PlanConnectorModal
        ideaId={idea.id}
        ideaTitle={idea.title}
        open={planConnectorOpen}
        onClose={() => setPlanConnectorOpen(false)}
        onAttached={() => void fetchIdea({ showLoading: false })}
      />

    </div>
  )
}


