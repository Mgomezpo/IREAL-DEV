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

    const { data: sections, error } = await supabase
      .from("plan_sections")
      .select("*")
      .eq("plan_id", params.id)
      .eq("user_id", user.id)
      .order("order_index", { ascending: true })

    if (error) throw error

    return NextResponse.json(sections || [])
  } catch (error) {
    console.error("[v0] Error fetching sections:", error)
    return NextResponse.json({ error: "Error al cargar secciones" }, { status: 500 })
  }
}

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
    const { title, section_type, content, order_index } = body

    const { data: section, error } = await supabase
      .from("plan_sections")
      .insert({
        plan_id: params.id,
        user_id: user.id,
        title,
        section_type,
        content: content || {},
        order_index,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(section)
  } catch (error) {
    console.error("[v0] Error creating section:", error)
    return NextResponse.json({ error: "Error al crear sección" }, { status: 500 })
  }
}
