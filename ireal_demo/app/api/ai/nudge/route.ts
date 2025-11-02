import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { callService } from "@/lib/service-client";
import { resolveUserIdForRateLimit } from "@/lib/request-context";

const SERVICE_PATH = "/v1/ai/nudge";

export async function POST(request: NextRequest) {
  try {
    const { fragment, userId } = await request.json();

    if (!fragment || typeof fragment !== "string") {
      return NextResponse.json(
        {
          data: null,
          error: { code: "INVALID_REQUEST", message: "Fragment is required" },
          meta: { requestId: randomUUID() },
        },
        { status: 400 },
      );
    }

    const resolvedUserId = userId ?? (await resolveUserIdForRateLimit(request));

    const response = await callService(SERVICE_PATH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": resolvedUserId,
      },
      body: JSON.stringify({ fragment, userId: userId ?? resolvedUserId }),
    });

    if (response.status === 204 || response.status === 429) {
      return new NextResponse(null, { status: 204 });
    }

    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status });
  } catch (error: unknown) {
    if ((error as Error).name === "AbortError") {
      return new NextResponse(null, { status: 204 });
    }

    console.error("[v0] AI nudge error:", error);
    return new NextResponse(null, { status: 204 });
  }
}
