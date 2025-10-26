import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: { id: string } }) {
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
    const { sections } = body // Array of { id, order_index }

    // Update each section's order_index
    const updates = sections.map((section: any) =>
      supabase
        .from("plan_sections")
        .update({ order_index: section.order_index })
        .eq("id", section.id)
        .eq("plan_id", params.id)
        .eq("user_id", user.id),
    )

    await Promise.all(updates)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error reordering sections:", error)
    return NextResponse.json({ error: "Error al reordenar secciones" }, { status: 500 })
  }
}
