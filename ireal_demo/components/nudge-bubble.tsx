"use client"

import { useEffect, useState, useRef } from "react"
import { RotateCw, Plus, Pin, X } from "lucide-react"

interface NudgeBubbleProps {
  question: string
  onDismiss: () => void
  onRegenerate?: () => void
  onInsert?: () => void
  onPin?: () => void
}

export function NudgeBubble({ question, onDismiss, onRegenerate, onInsert, onPin }: NudgeBubbleProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const bubbleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 50)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return

      if (e.key === "Escape") {
        handleDismiss()
      } else if (e.key === "Enter" && onInsert) {
        onInsert()
      } else if (e.key === "r" || e.key === "R") {
        if (onRegenerate) onRegenerate()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isVisible, onInsert, onRegenerate])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(onDismiss, 300)
  }

  return (
    <div
      ref={bubbleRef}
      role="note"
      aria-label="Sugerencia de IA"
      aria-live="polite"
      className={`relative flex items-start gap-2 my-3 transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        className="flex-shrink-0 mt-1.5 text-[var(--accent-600)]/40"
        aria-hidden="true"
      >
        <path
          d="M2 2 L2 10 L10 10"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7 7 L10 10 L7 13"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div className="flex-1 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-2 bg-[#F5EFE6] border border-[var(--accent-200)] rounded-lg shadow-sm">
          <p
            className="text-sm text-black/80 italic leading-relaxed line-clamp-2 font-sans"
            style={{ wordBreak: "break-word" }}
          >
            {question}
          </p>

          <div
            className={`flex items-center gap-1 transition-opacity duration-200 ${
              showActions ? "opacity-100" : "opacity-0"
            }`}
          >
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="p-1 hover:bg-black/5 rounded transition-colors"
                aria-label="Regenerar (R)"
                title="Regenerar (R)"
              >
                <RotateCw className="h-3.5 w-3.5 text-black/60" />
              </button>
            )}

            {onInsert && (
              <button
                onClick={onInsert}
                className="p-1 hover:bg-black/5 rounded transition-colors"
                aria-label="Insertar como sub-bullet (Enter)"
                title="Insertar (Enter)"
              >
                <Plus className="h-3.5 w-3.5 text-black/60" />
              </button>
            )}

            {onPin && (
              <button
                onClick={onPin}
                className="p-1 hover:bg-black/5 rounded transition-colors"
                aria-label="Fijar"
                title="Fijar"
              >
                <Pin className="h-3.5 w-3.5 text-black/60" />
              </button>
            )}

            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-black/5 rounded transition-colors"
              aria-label="Ocultar (Esc)"
              title="Ocultar (Esc)"
            >
              <X className="h-3.5 w-3.5 text-black/60" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
