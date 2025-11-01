import { randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { callService } from "@/lib/service-client"

const SERVICE_PATH = "/v1/ai/calendar"
const decoder = new TextDecoder()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await callService(SERVICE_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!response.body) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "AI_CALENDAR_ERROR", message: "No response body" },
          meta: { requestId: randomUUID() },
        },
        { status: 502 },
      )
    }

    const reader = response.body.getReader()
    let buffer = ""
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
    }

    const match = buffer.match(/data: (.*)\n\n/)
    if (!match) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "AI_CALENDAR_PARSE_ERROR", message: "Unable to parse calendar stream" },
          meta: { requestId: randomUUID() },
        },
        { status: 502 },
      )
    }

    const payload = JSON.parse(match[1])
    const status = payload.error ? 500 : response.status
    return NextResponse.json(payload, { status })
  } catch (error) {
    console.error("[v0] Calendar generation error:", error)
    return NextResponse.json(
      {
        data: null,
        error: { code: "AI_CALENDAR_ERROR", message: "Error generating calendar" },
        meta: { requestId: randomUUID() },
      },
      { status: 500 },
    )
  }
}
