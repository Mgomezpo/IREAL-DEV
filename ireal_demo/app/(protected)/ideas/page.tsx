"use client"

import { isIdeaPlanStabilityEnabled } from "@/lib/feature-flags"
import EnhancedIdeas from "./components/enhanced-ideas"
import LegacyIdeas from "./components/legacy-ideas"

export default function Ideas() {
  const ideaPlanEnabled = isIdeaPlanStabilityEnabled()
  return ideaPlanEnabled ? <EnhancedIdeas /> : <LegacyIdeas />
}
