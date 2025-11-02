import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { callService } from "@/lib/service-client"

const SERVICE_ENABLED = process.env.IDEAS_SERVICE_ENABLED === "true"
const SERVICE_BASE_PATH = "/v1/ideas"

const buildServicePath = (ideaId: string) => `${SERVICE_BASE_PATH}/${ideaId}`

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const ideaId = params.id
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!SERVICE_ENABLED) {
    const { data, error } = await supabase
      .from("ideas")
      .select("*")
      .eq("id", ideaId)
      .eq("user_id", user.id)
      .single()

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json({ error: "Failed to fetch idea" }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 })
    }

    return NextResponse.json(data)
  }

  const response = await callService(buildServicePath(ideaId), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": user.id,
    },
  })

  const envelope = await response.json()

  if (!response.ok) {
    return NextResponse.json(envelope, { status: response.status })
  }

  return NextResponse.json(envelope.data ?? null, { status: response.status })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const ideaId = params.id
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()

  if (!SERVICE_ENABLED) {
    const { data, error } = await supabase
      .from("ideas")
      .update({
        title: body.title ?? undefined,
        content: body.content ?? undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ideaId)
      .eq("user_id", user.id)
      .select("*")
      .single()

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json({ error: "Failed to update idea" }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 })
    }

    return NextResponse.json(data)
  }

  const response = await callService(buildServicePath(ideaId), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": user.id,
    },
    body: JSON.stringify(body ?? {}),
  })

  const envelope = await response.json()
  if (!response.ok) {
    return NextResponse.json(envelope, { status: response.status })
  }

  return NextResponse.json(envelope.data ?? null, { status: response.status })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const ideaId = params.id
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!SERVICE_ENABLED) {
    const { error } = await supabase
      .from("ideas")
      .delete()
      .eq("id", ideaId)
      .eq("user_id", user.id)

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json({ error: "Failed to delete idea" }, { status: 500 })
    }

    return new NextResponse(null, { status: 204 })
  }

  const response = await callService(buildServicePath(ideaId), {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": user.id,
    },
  })

  if (response.status === 204) {
    return new NextResponse(null, { status: 204 })
  }

  const envelope = await response.json()
  return NextResponse.json(envelope.data ?? null, { status: response.status })
}
