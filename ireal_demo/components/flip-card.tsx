"use client"

import type React from "react"

import { useState } from "react"
import { RotateCcw } from "lucide-react"

interface FlipCardProps {
  frontContent: React.ReactNode
  backContent: React.ReactNode
}

export function FlipCard({ frontContent, backContent }: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <div className="relative w-full h-full" style={{ perspective: "2000px" }}>
      <button
        onClick={() => setIsFlipped(!isFlipped)}
        className="absolute top-4 right-4 z-20 p-2 bg-white/80 hover:bg-white border border-[#E5E5E5] rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
        aria-label={isFlipped ? "Ver documento" : "Ver información del plan"}
        title={isFlipped ? "Ver documento" : "Ver información del plan"}
      >
        <RotateCcw className="h-4 w-4 text-black" />
      </button>

      <div
        className="relative w-full h-full transition-transform duration-700 ease-in-out"
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          {frontContent}
        </div>

        <div
          className="absolute inset-0 w-full h-full"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {backContent}
        </div>
      </div>
    </div>
  )
}
