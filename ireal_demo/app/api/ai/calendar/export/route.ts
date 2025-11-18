import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { callService } from "@/lib/service-client";
import { resolveUserIdForRateLimit } from "@/lib/request-context";

const SERVICE_PATH = "/v1/ai/calendar/export";
const SERVICE_ENABLED = process.env.PUBLISH_SERVICE_ENABLED === "true";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const userId = await resolveUserIdForRateLimit(request);

  if (!SERVICE_ENABLED) {
    return NextResponse.json(
      {
        data: {
          calendarId: typeof body?.calendarId === "string" ? body.calendarId : null,
          runId: typeof body?.runId === "string" ? body.runId : null,
          format: body?.format ?? "json",
          status: "disabled",
        },
        error: null,
        meta: { provider: "legacy-publish-disabled", requestId: randomUUID() },
      },
      { status: 200 },
    );
  }

  try {
    const response = await callService(SERVICE_PATH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
      },
      body: JSON.stringify(body),
    });

    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    console.error("[calendar/export] error:", error);
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "CALENDAR_EXPORT_ERROR",
          message: "Failed to export calendar entries",
        },
        meta: { requestId: randomUUID() },
      },
      { status: 502 },
    );
  }
}
