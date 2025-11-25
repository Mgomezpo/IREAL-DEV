"use client"

import type { HTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

type HardCardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  animate?: boolean
  contentClassName?: string
}

export function HardCard({ children, className, contentClassName, animate = true, ...props }: HardCardProps) {
  return (
    <div className={cn("relative isolate w-full h-full", animate && "animate-fade-in-up", className)} {...props}>
      <div
        aria-hidden
        className="absolute inset-0 translate-x-[6px] translate-y-[6px] rounded-xl border-[3px] border-black bg-black/90"
      />
      <div
        className={cn(
          "relative h-full rounded-xl border-[3px] border-black bg-[var(--surface)] px-5 py-5 shadow-[0_2px_0_rgba(0,0,0,0.35)]",
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  )
}
