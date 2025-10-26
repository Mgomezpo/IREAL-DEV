import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data: plan, error } = await supabase
      .from("plans")
      .select(
        `
        *,
        plan_sections (
          id,
          title,
          content,
          section_type,
          order_index
        )
      `,
      )
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single()

    if (error) throw error

    if (!plan) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })
    }

    // Calculate progress
    const sections = plan.plan_sections || []
    const progress = calculatePlanProgress(sections)

    return NextResponse.json({
      ...plan,
      progress,
    })
  } catch (error) {
    console.error("[v0] Error fetching plan:", error)
    return NextResponse.json({ error: "Error al cargar plan" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, start_date, end_date, channels, status } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (start_date !== undefined) updateData.start_date = start_date
    if (end_date !== undefined) updateData.end_date = end_date
    if (channels !== undefined) updateData.channels = channels
    if (status !== undefined) updateData.status = status

    const { data: plan, error } = await supabase
      .from("plans")
      .update(updateData)
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(plan)
  } catch (error) {
    console.error("[v0] Error updating plan:", error)
    return NextResponse.json({ error: "Error al actualizar plan" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { error } = await supabase.from("plans").delete().eq("id", params.id).eq("user_id", user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting plan:", error)
    return NextResponse.json({ error: "Error al eliminar plan" }, { status: 500 })
  }
}

// Helper function (same as in route.ts)
function calculatePlanProgress(sections: any[]) {
  if (!sections || sections.length === 0) {
    return { doc: 0, schedule: 0, approvals: 0, overall: 0 }
  }

  const docSections = sections.filter((s) =>
    ["summary", "goals", "audience", "messages", "pillars", "resources"].includes(s.section_type),
  )
  const scheduleSections = sections.filter((s) => ["calendar", "backlog"].includes(s.section_type))
  const approvalSections = sections.filter((s) => ["approvals", "kpis"].includes(s.section_type))

  const docProgress = calculateCategoryProgress(docSections)
  const scheduleProgress = calculateCategoryProgress(scheduleSections)
  const approvalsProgress = calculateCategoryProgress(approvalSections)

  const overall = Math.round(docProgress * 0.4 + scheduleProgress * 0.4 + approvalsProgress * 0.2)

  return {
    doc: docProgress,
    schedule: scheduleProgress,
    approvals: approvalsProgress,
    overall,
  }
}

function calculateCategoryProgress(sections: any[]) {
  if (sections.length === 0) return 0

  const completedSections = sections.filter((s) => {
    const content = s.content
    if (!content || typeof content !== "object") return false
    const hasText = content.text && content.text.trim().length > 0
    const hasBlocks = content.blocks && Array.isArray(content.blocks) && content.blocks.length > 0
    return hasText || hasBlocks
  })

  return Math.round((completedSections.length / sections.length) * 100)
}
