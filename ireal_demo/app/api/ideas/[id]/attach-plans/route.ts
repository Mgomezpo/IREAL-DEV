import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { planIds } = body

    if (!Array.isArray(planIds)) {
      return NextResponse.json({ error: "planIds must be an array" }, { status: 400 })
    }

    const { data: idea, error: ideaError } = await supabase.from("ideas").select("id").eq("id", id).single()

    if (ideaError || !idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 })
    }

    await supabase.from("ideas_plans").delete().eq("idea_id", id)

    if (planIds.length > 0) {
      const relationships = planIds.map((planId) => ({
        idea_id: id,
        plan_id: planId,
      }))

      const { error: insertError } = await supabase.from("ideas_plans").insert(relationships)

      if (insertError) {
        console.error("[v0] Database error:", insertError)
        return NextResponse.json({ error: "Failed to attach plans" }, { status: 500 })
      }
    }

    console.log("[v0] Attached plans to idea:", id, planIds)

    return NextResponse.json({
      id,
      linkedPlanIds: planIds,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Error attaching plans:", error)
    return NextResponse.json({ error: "Failed to attach plans" }, { status: 500 })
  }
}
