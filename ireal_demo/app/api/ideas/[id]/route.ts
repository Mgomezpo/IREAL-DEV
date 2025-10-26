import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { data: idea, error } = await supabase.from("ideas").select("*").eq("id", id).single()

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json({ error: "Idea not found" }, { status: 404 })
    }

    return NextResponse.json(idea)
  } catch (error) {
    console.error("[v0] Error fetching idea:", error)
    return NextResponse.json({ error: "Failed to fetch idea" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    const { title, content } = body

    const { data: updatedIdea, error } = await supabase
      .from("ideas")
      .update({
        title: title || "Sin título",
        content: content || "",
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json({ error: "Failed to update idea" }, { status: 500 })
    }

    console.log("[v0] Updated idea:", id)
    return NextResponse.json(updatedIdea)
  } catch (error) {
    console.error("[v0] Error updating idea:", error)
    return NextResponse.json({ error: "Failed to update idea" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { error } = await supabase.from("ideas").delete().eq("id", id)

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json({ error: "Failed to delete idea" }, { status: 500 })
    }

    console.log("[v0] Deleted idea:", id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting idea:", error)
    return NextResponse.json({ error: "Failed to delete idea" }, { status: 500 })
  }
}
