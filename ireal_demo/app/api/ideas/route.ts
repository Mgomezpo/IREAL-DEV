import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, content } = body

    const { data: newIdea, error } = await supabase
      .from("ideas")
      .insert({
        user_id: user.id,
        title: title || "Sin título",
        content: content || "",
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json({ error: "Failed to create idea" }, { status: 500 })
    }

    console.log("[v0] Created new idea:", newIdea.id)
    return NextResponse.json(newIdea, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating idea:", error)
    return NextResponse.json({ error: "Failed to create idea" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")

    let query = supabase.from("ideas").select("*").order("created_at", { ascending: false })

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
    }

    const { data: ideas, error } = await query

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json({ error: "Failed to fetch ideas" }, { status: 500 })
    }

    return NextResponse.json(ideas || [])
  } catch (error) {
    console.error("[v0] Error fetching ideas:", error)
    return NextResponse.json({ error: "Failed to fetch ideas" }, { status: 500 })
  }
}
