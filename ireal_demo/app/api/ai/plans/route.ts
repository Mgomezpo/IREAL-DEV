import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { callService } from "@/lib/service-client";
import { resolveUserIdForRateLimit } from "@/lib/request-context";

const SERVICE_PATH = "/v1/ai/plans";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
  } catch (error) {
    console.error("[v0] Plans AI API error:", error);
    return NextResponse.json(
      {
        data: null,
        error: { code: "AI_PLAN_ERROR", message: "Error al generar respuesta" },
        meta: { requestId: randomUUID() },
      },
      { status: 500 },
    );
  }
}
