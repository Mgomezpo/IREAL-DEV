import { randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { callService } from "@/lib/service-client"

const SERVICE_PATH = "/v1/ai/calendar"

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

    const stream = new ReadableStream({
      start(controller) {
        const reader = response.body!.getReader()
        const forward = (): void => {
          reader
            .read()
            .then(({ value, done }) => {
              if (done) {
                controller.close()
                return
              }
              if (value) {
                controller.enqueue(value)
              }
              forward()
            })
            .catch((error) => {
              controller.error(error)
            })
        }
        forward()
      },
      cancel(reason) {
        response.body?.cancel(reason).catch(() => {})
      },
    })

    const headers = new Headers(response.headers)
    headers.set("Content-Type", "text/event-stream")
    headers.set("Cache-Control", "no-cache")
    headers.set("Connection", "keep-alive")

    return new Response(stream, {
      status: response.status,
      headers,
    })
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
