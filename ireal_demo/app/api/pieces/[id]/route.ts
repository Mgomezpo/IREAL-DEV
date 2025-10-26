import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { data: piece, error } = await supabase
      .from("pieces")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single()

    if (error || !piece) {
      return NextResponse.json({ error: "Pieza no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ piece })
  } catch (error) {
    console.error("[v0] Unexpected error in GET /api/pieces/[id]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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
      publish_state,
      publish_attempts,
      publish_last_error,
      publish_permalink,
    } = body

    // Build update object with only provided fields
    const updates: any = { updated_at: new Date().toISOString() }
    if (title !== undefined) updates.title = title
    if (channel !== undefined) updates.channel = channel
    if (account_id !== undefined) updates.account_id = account_id
    if (format !== undefined) updates.format = format
    if (status !== undefined) updates.status = status
    if (date !== undefined) updates.date = date
    if (time !== undefined) updates.time = time
    if (copy !== undefined) updates.copy = copy
    if (script !== undefined) updates.script = script
    if (target_audience !== undefined) updates.target_audience = target_audience
    if (autopost_enabled !== undefined) updates.autopost_enabled = autopost_enabled
    if (publish_state !== undefined) updates.publish_state = publish_state
    if (publish_attempts !== undefined) updates.publish_attempts = publish_attempts
    if (publish_last_error !== undefined) updates.publish_last_error = publish_last_error
    if (publish_permalink !== undefined) updates.publish_permalink = publish_permalink

    const { data: piece, error } = await supabase
      .from("pieces")
      .update(updates)
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating piece:", error)
      return NextResponse.json({ error: "Error al actualizar pieza" }, { status: 500 })
    }

    return NextResponse.json({ piece })
  } catch (error) {
    console.error("[v0] Unexpected error in PATCH /api/pieces/[id]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Delete associated assets first
    const { data: assets } = await supabase.from("assets").select("storage_path").eq("piece_id", params.id)

    if (assets && assets.length > 0) {
      // Delete files from storage
      const filePaths = assets.map((asset) => asset.storage_path)
      await supabase.storage.from("assets").remove(filePaths)

      // Delete asset records
      await supabase.from("assets").delete().eq("piece_id", params.id)
    }

    // Delete the piece
    const { error } = await supabase.from("pieces").delete().eq("id", params.id).eq("user_id", user.id)

    if (error) {
      console.error("[v0] Error deleting piece:", error)
      return NextResponse.json({ error: "Error al eliminar pieza" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Unexpected error in DELETE /api/pieces/[id]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
