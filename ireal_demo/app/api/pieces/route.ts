import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const month = searchParams.get("month") // Format: YYYY-MM
    const week = searchParams.get("week") // Format: YYYY-WW
    const planId = searchParams.get("planId")

    let query = supabase.from("pieces").select("*").eq("user_id", user.id).order("date", { ascending: true })

    // Filter by month if provided
    if (month) {
      const [year, monthNum] = month.split("-")
      const startDate = `${year}-${monthNum}-01`
      const endDate = new Date(Number.parseInt(year), Number.parseInt(monthNum), 0).toISOString().split("T")[0]
      query = query.gte("date", startDate).lte("date", endDate)
    }

    // Filter by plan if provided
    if (planId) {
      query = query.eq("plan_id", planId)
    }

    const { data: pieces, error } = await query

    if (error) {
      console.error("[v0] Error fetching pieces:", error)
      return NextResponse.json({ error: "Error al cargar piezas" }, { status: 500 })
    }

    return NextResponse.json({ pieces: pieces || [] })
  } catch (error) {
    console.error("[v0] Unexpected error in GET /api/pieces:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const {
      plan_id,
      title,
      channel,
      account_id,
      format,
      status = "draft",
      date,
      time,
      copy,
      script,
      target_audience,
      autopost_enabled = false,
    } = body

    // Validate required fields
    if (!title || !channel || !date) {
      return NextResponse.json({ error: "Faltan campos requeridos: title, channel, date" }, { status: 400 })
    }

    // Create piece
    const { data: piece, error } = await supabase
      .from("pieces")
      .insert({
        user_id: user.id,
        plan_id,
        title,
        channel,
        account_id,
        format,
        status,
        date,
        time,
        copy,
        script,
        target_audience,
        autopost_enabled,
        publish_state: "idle",
        publish_attempts: 0,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating piece:", error)
      return NextResponse.json({ error: "Error al crear pieza" }, { status: 500 })
    }

    return NextResponse.json({ piece }, { status: 201 })
  } catch (error) {
    console.error("[v0] Unexpected error in POST /api/pieces:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
