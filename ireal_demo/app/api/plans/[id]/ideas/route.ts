import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { callService } from "@/lib/service-client"

const SERVICE_ENABLED = process.env.IDEAS_SERVICE_ENABLED === "true"
const SERVICE_BASE_PATH = "/v1/ideas"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!SERVICE_ENABLED) {
    // Local fallback: join ideas_plans
    const { data, error } = await supabase
      .from("ideas_plans")
      .select("ideas(*)")
      .eq("plan_id", params.id)
      .eq("ideas.user_id", user.id)

    if (error) {
      console.error("[v0] Error fetching ideas by plan:", error)
      return NextResponse.json({ error: "Failed to fetch ideas" }, { status: 500 })
    }

    const ideas = (data ?? [])
      .map((row) => row.ideas)
      .filter(Boolean)
    return NextResponse.json(ideas ?? [])
  }

  const response = await callService(`${SERVICE_BASE_PATH}/by-plan/${params.id}`, {
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

  return NextResponse.json(envelope.data ?? [])
}
