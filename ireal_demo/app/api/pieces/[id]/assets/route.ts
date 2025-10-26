import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Verify piece belongs to user
    const { data: piece, error: pieceError } = await supabase
      .from("pieces")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single()

    if (pieceError || !piece) {
      return NextResponse.json({ error: "Pieza no encontrada" }, { status: 404 })
    }

    // Get file from form data
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "video/mp4", "video/quicktime", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de archivo no permitido. Usa .png, .jpg, .mp4, .mov o .pdf" },
        { status: 400 },
      )
    }

    // Generate unique file name
    const fileExt = file.name.split(".").pop()
    const fileName = `${user.id}/${params.id}/${Date.now()}.${fileExt}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage.from("assets").upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    })

    if (uploadError) {
      console.error("[v0] Error uploading file:", uploadError)
      return NextResponse.json({ error: "Error al subir archivo" }, { status: 500 })
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("assets").getPublicUrl(fileName)

    // Create asset record
    const { data: asset, error: assetError } = await supabase
      .from("assets")
      .insert({
        piece_id: params.id,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: fileName,
        public_url: publicUrl,
      })
      .select()
      .single()

    if (assetError) {
      console.error("[v0] Error creating asset record:", assetError)
      // Try to clean up uploaded file
      await supabase.storage.from("assets").remove([fileName])
      return NextResponse.json({ error: "Error al registrar asset" }, { status: 500 })
    }

    return NextResponse.json({ asset }, { status: 201 })
  } catch (error) {
    console.error("[v0] Unexpected error in POST /api/pieces/[id]/assets:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

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

    // Get assets for piece
    const { data: assets, error } = await supabase
      .from("assets")
      .select("*")
      .eq("piece_id", params.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching assets:", error)
      return NextResponse.json({ error: "Error al cargar assets" }, { status: 500 })
    }

    return NextResponse.json({ assets: assets || [] })
  } catch (error) {
    console.error("[v0] Unexpected error in GET /api/pieces/[id]/assets:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
