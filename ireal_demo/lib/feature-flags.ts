export function isIdeaPlanStabilityEnabled() {
  const raw = process.env.NEXT_PUBLIC_IDEA_PLAN_STABILITY
  if (raw === undefined) {
    return false
  }
  return raw === "true" || raw === "1"
}
