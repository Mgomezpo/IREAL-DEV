import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Get plans with their sections and calculate progress
    const { data: plans, error } = await supabase
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
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    // Calculate progress for each plan
    const plansWithProgress = plans?.map((plan) => {
      const sections = plan.plan_sections || []
      const progress = calculatePlanProgress(sections)

      return {
        ...plan,
        progress,
      }
    })

    return NextResponse.json(plansWithProgress || [])
  } catch (error) {
    console.error("[v0] Error fetching plans:", error)
    return NextResponse.json({ error: "Error al cargar planes" }, { status: 500 })
  }
}

export async function POST(request: Request) {
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
    const { name, description, start_date, end_date, channels } = body

    // Create plan
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .insert({
        user_id: user.id,
        name,
        description,
        start_date,
        end_date,
        channels: channels || [],
        status: "draft",
      })
      .select()
      .single()

    if (planError) throw planError

    // Create default sections
    const defaultSections = [
      { title: "Resumen ejecutivo", section_type: "summary", order_index: 0 },
      { title: "Objetivos (SMART)", section_type: "goals", order_index: 1 },
      { title: "Audiencia & ICP", section_type: "audience", order_index: 2 },
      { title: "Propuesta de valor & Mensajes", section_type: "messages", order_index: 3 },
      { title: "Pilares de contenido", section_type: "pillars", order_index: 4 },
      { title: "Calendario", section_type: "calendar", order_index: 5 },
      { title: "Backlog de piezas", section_type: "backlog", order_index: 6 },
      { title: "KPIs & Métricas", section_type: "kpis", order_index: 7 },
      { title: "Recursos & Presupuesto", section_type: "resources", order_index: 8 },
      { title: "Aprobaciones & Notas", section_type: "approvals", order_index: 9 },
    ]

    const sectionsToInsert = defaultSections.map((section) => ({
      plan_id: plan.id,
      user_id: user.id,
      ...section,
      content: {},
    }))

    const { error: sectionsError } = await supabase.from("plan_sections").insert(sectionsToInsert)

    if (sectionsError) throw sectionsError

    return NextResponse.json(plan)
  } catch (error) {
    console.error("[v0] Error creating plan:", error)
    return NextResponse.json({ error: "Error al crear plan" }, { status: 500 })
  }
}

// Helper function to calculate progress
function calculatePlanProgress(sections: any[]) {
  if (!sections || sections.length === 0) {
    return { doc: 0, schedule: 0, approvals: 0, overall: 0 }
  }

  // Categorize sections
  const docSections = sections.filter((s) =>
    ["summary", "goals", "audience", "messages", "pillars", "resources"].includes(s.section_type),
  )
  const scheduleSections = sections.filter((s) => ["calendar", "backlog"].includes(s.section_type))
  const approvalSections = sections.filter((s) => ["approvals", "kpis"].includes(s.section_type))

  // Calculate completion for each category
  const docProgress = calculateCategoryProgress(docSections)
  const scheduleProgress = calculateCategoryProgress(scheduleSections)
  const approvalsProgress = calculateCategoryProgress(approvalSections)

  // Overall progress with weighting: 40% doc, 40% schedule, 20% approvals
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

    // Check if content has meaningful data
    const hasText = content.text && content.text.trim().length > 0
    const hasBlocks = content.blocks && Array.isArray(content.blocks) && content.blocks.length > 0

    return hasText || hasBlocks
  })

  return Math.round((completedSections.length / sections.length) * 100)
}
