import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { callService } from "@/lib/service-client"

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const response = await callService(`/v1/plans/${params.id}/generate-strategy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": user.id,
      },
    })

    const body = await response.json()
    if (!response.ok) {
      return NextResponse.json(body, { status: response.status })
    }

    return NextResponse.json(body.data ?? body)
  } catch (err) {
    console.error("[v0] Error generating strategy", err)
    return NextResponse.json({ error: "Failed to generate strategy" }, { status: 502 })
  }
}
