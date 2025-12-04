import type { IdeaRecord } from "@/hooks/useIdeasData"

export interface Idea extends IdeaRecord {
  channel?: "IG" | "YT" | "X" | "LI" | "GEN"
  priority?: "low" | "medium" | "high"
  status: "active" | "archived"
  pinned: boolean
  linked_plan_ids?: string[]
}

export interface IdeasGroup {
  title: string
  dateRange: string
  ideas: Idea[]
  isCollapsed: boolean
}
