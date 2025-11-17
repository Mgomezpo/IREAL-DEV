import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { callService } from "@/lib/service-client";
import { resolveUserIdForRateLimit } from "@/lib/request-context";

const SERVICE_PATH = "/v1/ai/calendar/save";
const SERVICE_ENABLED = process.env.CALENDAR_SERVICE_ENABLED === "true";

export async function POST(request: NextRequest) {
  const userId = await resolveUserIdForRateLimit(request);

  if (!SERVICE_ENABLED) {
    const body = await request.json();
    return NextResponse.json(
      {
        data: {
          calendarId:
            typeof body?.calendarId === "string" ? body.calendarId : randomUUID(),
          runId: "legacy",
        },
        error: null,
        meta: { provider: "legacy-fallback" },
      },
      { status: 200 },
    );
  }

  const body = await request.json();

  const response = await callService(SERVICE_PATH, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": userId,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "AI_CALENDAR_SAVE_ERROR",
          message: `Failed to save calendar entries (status ${response.status})`,
        },
        meta: { requestId: randomUUID() },
      },
      { status: response.status },
    );
  }

  const payload = await response.json();

  return NextResponse.json(payload, { status: 200 });
}
