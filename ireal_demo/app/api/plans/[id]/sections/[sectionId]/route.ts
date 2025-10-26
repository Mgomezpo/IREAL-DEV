import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(request: Request, { params }: { params: { id: string; sectionId: string } }) {
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
    const { title, content, order_index } = body

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (order_index !== undefined) updateData.order_index = order_index

    const { data: section, error } = await supabase
      .from("plan_sections")
      .update(updateData)
      .eq("id", params.sectionId)
      .eq("plan_id", params.id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(section)
  } catch (error) {
    console.error("[v0] Error updating section:", error)
    return NextResponse.json({ error: "Error al actualizar sección" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string; sectionId: string } }) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { error } = await supabase
      .from("plan_sections")
      .delete()
      .eq("id", params.sectionId)
      .eq("plan_id", params.id)
      .eq("user_id", user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting section:", error)
    return NextResponse.json({ error: "Error al eliminar sección" }, { status: 500 })
  }
}
