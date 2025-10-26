"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus } from "lucide-react"
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

  // Find the paragraph node
  while (node && node !== element) {
    if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === "P") {
      return (node as HTMLElement).textContent || ""
    }
    node = node.parentNode as Node
  }

  // If no paragraph found, return all text
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

export default function NewIdea() {
  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [ideaId, setIdeaId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const titleCreatedRef = useRef(false)

  const [currentNudge, setCurrentNudge] = useState<string | null>(null)
  const [nudgeCount, setNudgeCount] = useState(0)
  const [lastNudgeTime, setLastNudgeTime] = useState<number>(0)
  const [seenParagraphHashes, setSeenParagraphHashes] = useState<Set<string>>(new Set())
  const nudgeTimeoutRef = useRef<NodeJS.Timeout>()
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const isTypingRef = useRef(false)
  const nudgeAbortControllerRef = useRef<AbortController | null>(null)

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

    // Don't trigger if:
    // - Less than 20s since last nudge
    // - Already shown 5 nudges in this note
    // - User is still typing
    if (timeSinceLastNudge < 20000 || nudgeCount >= 5 || isTypingRef.current) {
      return
    }

    const paragraph = getCurrentParagraph(contentRef.current)
    const paragraphHash = hashString(paragraph)

    // Don't trigger if we've already seen this paragraph
    if (seenParagraphHashes.has(paragraphHash)) {
      return
    }

    const wordCount = countWords(paragraph)
    const titleWordCount = countWords(title)

    // Check heuristics:
    // 1. Minimum length: ≥12 words in paragraph OR title not empty + ≥6 words
    const hasMinLength = wordCount >= 12 || (title.trim() && wordCount >= 6)

    // 2. Ends with punctuation
    const hasPunctuation = endsWithPunctuation(paragraph)

    // 3. Has action verb
    const hasAction = hasActionVerb(paragraph) || hasActionVerb(title)

    if (!hasMinLength || !hasPunctuation || !hasAction) {
      return
    }

    // All heuristics passed, trigger nudge
    console.log("[v0] Nudge heuristics passed, requesting nudge...")

    // Cancel any previous nudge request
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
        // No nudge available, that's ok
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

  const handleNavigation = (path: string) => {
    setIsTransitioning(true)
    setTimeout(() => {
      router.push(path)
    }, 350)
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
    if (ideaId) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      saveTimeoutRef.current = setTimeout(() => {
        handleSave(contentRef.current?.textContent || "", title)
      }, 500)
    }
  }

  const handleTitleChange = async (newTitle: string) => {
    setTitle(newTitle)

    // Create idea automatically when user types a title
    if (!titleCreatedRef.current && newTitle.trim() && !ideaId) {
      titleCreatedRef.current = true
      try {
        const response = await fetch("/api/ideas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: newTitle }),
        })

        if (response.ok) {
          const data = await response.json()
          setIdeaId(data.id)
          setLastSaved(new Date())
          console.log("[v0] Idea auto-created with ID:", data.id)
        }
      } catch (error) {
        console.error("[v0] Error creating idea:", error)
        titleCreatedRef.current = false
      }
    } else if (ideaId && newTitle.trim()) {
      // Update title if idea already exists
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      saveTimeoutRef.current = setTimeout(() => {
        handleSave(content, newTitle)
      }, 2000)
    }
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

    // Cancel any pending nudge request
    if (nudgeAbortControllerRef.current) {
      nudgeAbortControllerRef.current.abort()
    }

    // Autosave logic
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    if (ideaId) {
      saveTimeoutRef.current = setTimeout(() => {
        handleSave(newContent, title)
      }, 2000)
    }

    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false
    }, 1200)

    nudgeTimeoutRef.current = setTimeout(() => {
      checkForNudge()
    }, 1200)
  }

  const handleSave = async (contentToSave: string, titleToSave: string) => {
    if (!ideaId) return

    setSaving(true)

    try {
      const response = await fetch(`/api/ideas/${ideaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleToSave, description: contentToSave }),
      })

      if (response.ok) {
        setLastSaved(new Date())
        console.log("[v0] Idea auto-saved successfully")
      }
    } catch (error) {
      console.error("[v0] Error saving idea:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        // Shift+Enter: line break within paragraph
        e.preventDefault()
        document.execCommand("insertLineBreak")
      } else {
        // Enter: new paragraph
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
    // TODO: Implement modal
  }

  return (
    <div className={`min-h-screen bg-[var(--surface)] ${isTransitioning ? "notebook-exit" : "notebook-enter"}`}>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => handleNavigation("/ideas")}
            className="p-2 hover:bg-black/5 rounded-lg transition-colors"
            aria-label="Volver a Ideas"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="text-right">
            {saving && <div className="text-xs text-[var(--accent-600)]">Guardando...</div>}
            {!saving && lastSaved && (
              <div className="text-xs text-black/40">
                Guardado hace {Math.floor((Date.now() - lastSaved.getTime()) / 1000)}s
              </div>
            )}
            {!saving && !lastSaved && ideaId && <div className="text-xs text-black/40">Guardado</div>}
          </div>
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Escribe un título…"
          className="w-full bg-transparent border-none outline-none text-4xl md:text-5xl font-semibold font-display tracking-tight text-black placeholder-black/30 mb-8 focus:ring-0"
          autoFocus
        />

        <div className="relative">
          <div
            ref={contentRef}
            contentEditable
            onInput={handleContentInput}
            onKeyDown={handleKeyDown}
            className="w-full min-h-[400px] bg-transparent border-none outline-none text-base leading-7 text-black focus:ring-0 empty:before:content-[attr(data-placeholder)] empty:before:text-black/30"
            style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
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

        {ideaId && (
          <div className="mt-6 pt-4 border-t border-[#E5E5E5]">
            <p className="text-sm text-black/60 mb-2">Vinculada a:</p>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-black/5 text-black/60">Ningún plan todavía</span>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[var(--surface)] via-[var(--surface)]/95 to-transparent p-6">
        <div className="max-w-4xl mx-auto flex justify-center">
          <button
            onClick={openAttachToPlanModal}
            disabled={!ideaId}
            className="group relative text-base text-black hover:text-white hover:bg-[var(--accent-600)] rounded-sm ring-1 ring-transparent hover:ring-[var(--accent-600)]/70 hover:shadow-[0_0_0_6px_rgba(138,15,28,0.10)] px-6 py-3 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4 inline mr-2" />
            Agregar a plan
          </button>
        </div>
      </div>
    </div>
  )
}
