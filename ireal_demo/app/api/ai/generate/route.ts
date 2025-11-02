import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { callService } from "@/lib/service-client";
import { resolveUserIdForRateLimit } from "@/lib/request-context";

const SERVICE_PATH = "/v1/ai/generate";

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body?.prompt) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "INVALID_REQUEST",
          message: "Prompt is required",
        },
        meta: {
          requestId: randomUUID(),
        },
      },
      { status: 400 },
    );
  }

  const userId = await resolveUserIdForRateLimit(request);

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
}
