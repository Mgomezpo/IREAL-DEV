import { randomUUID } from "crypto"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { callService } from "@/lib/service-client"

const SERVICE_PATH = "/v1/ai/plan-chat"

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "UNAUTHORIZED", message: "No autorizado" },
          meta: { requestId: randomUUID() },
        },
        { status: 401 },
      )
    }

    const body = await request.json()
    const response = await callService(SERVICE_PATH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": user.id,
      },
      body: JSON.stringify(body),
    })

    const payload = await response.json()
    return NextResponse.json(payload, { status: response.status })
  } catch (error) {
    console.error("[v0] Error in plan chat:", error)
    return NextResponse.json(
      {
        data: null,
        error: { code: "AI_PLAN_CHAT_ERROR", message: "Error al generar respuesta" },
        meta: { requestId: randomUUID() },
      },
      { status: 500 },
    )
  }
}
