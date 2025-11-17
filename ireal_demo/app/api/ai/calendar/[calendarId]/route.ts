import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { callService } from "@/lib/service-client";
import { resolveUserIdForRateLimit } from "@/lib/request-context";

const SERVICE_ENABLED = process.env.CALENDAR_SERVICE_ENABLED === "true";

export async function GET(
  _request: NextRequest,
  { params }: { params: { calendarId: string } },
) {
  const userId = await resolveUserIdForRateLimit(_request);
  const calendarId = params.calendarId;

  if (!SERVICE_ENABLED) {
    return NextResponse.json(
      {
        data: { calendarId, entries: [] },
        error: null,
        meta: { provider: "legacy-fallback", requestId: randomUUID() },
      },
      { status: 200 },
    );
  }

  const response = await callService(`/v1/ai/calendar/${calendarId}`, {
    method: "GET",
    headers: {
      "x-user-id": userId,
    },
  });

  if (!response.ok) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "AI_CALENDAR_LOAD_ERROR",
          message: `Failed to load calendar entries (status ${response.status})`,
        },
        meta: { requestId: randomUUID() },
      },
      { status: response.status },
    );
  }

  const payload = await response.json();
  return NextResponse.json(payload, { status: 200 });
}
