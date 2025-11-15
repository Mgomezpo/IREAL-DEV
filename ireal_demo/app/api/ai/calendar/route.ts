import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { callService } from "@/lib/service-client";
import { resolveUserIdForRateLimit } from "@/lib/request-context";

const SERVICE_PATH = "/v1/ai/calendar";
const SERVICE_ENABLED = process.env.CALENDAR_SERVICE_ENABLED === "true";
const encoder = new TextEncoder();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const userId = await resolveUserIdForRateLimit(request);

    if (!SERVICE_ENABLED) {
      return streamLegacyCalendar(body, userId);
    }

    const response = await callService(SERVICE_PATH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
      },
      body: JSON.stringify(body),
    });

    if (!response.body) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "AI_CALENDAR_ERROR", message: "No response body" },
          meta: { requestId: randomUUID() },
        },
        { status: 502 },
      );
    }

    const stream = new ReadableStream({
      start(controller) {
        const reader = response.body!.getReader();
        const forward = (): void => {
          reader
            .read()
            .then(({ value, done }) => {
              if (done) {
                controller.close();
                return;
              }
              if (value) {
                controller.enqueue(value);
              }
              forward();
            })
            .catch((error) => {
              controller.error(error);
            });
        };
        forward();
      },
      cancel(reason) {
        response.body?.cancel(reason).catch(() => {});
      },
    });

    const headers = new Headers(response.headers);
    headers.set("Content-Type", "text/event-stream");
    headers.set("Cache-Control", "no-cache");
    headers.set("Connection", "keep-alive");

    return new Response(stream, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error("[v0] Calendar generation error:", error);
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "AI_CALENDAR_ERROR",
          message: "Error generating calendar",
        },
        meta: { requestId: randomUUID() },
      },
      { status: 500 },
    );
  }
}

function streamLegacyCalendar(body: Record<string, unknown>, userId: string) {
  const pieces = buildFallbackCalendar(body);
  const total = pieces.length;
  const calendarId =
    typeof body?.calendarId === "string" ? body.calendarId : randomUUID();

  const stream = new ReadableStream({
    start(controller) {
      pieces.forEach((piece, index) => {
        const chunk = {
          data: {
            type: "calendar_piece",
            runId: "legacy",
            calendarId,
            index,
            total,
            piece,
          },
          error: null,
          meta: {
            requestId: randomUUID(),
            provider: "legacy-fallback",
            chunk: true,
            index,
            total,
          },
        };
        controller.enqueue(
          encoder.encode(`event: data\ndata: ${JSON.stringify(chunk)}\n\n`),
        );
      });

      const summary = {
        data: {
          type: "calendar_summary",
          calendarId,
          runId: "legacy",
          pieceCount: total,
          status: "completed",
          diff: { added: pieces, updated: [], removed: [] },
        },
        error: null,
        meta: {
          requestId: randomUUID(),
          provider: "legacy-fallback",
        },
      };

      controller.enqueue(
        encoder.encode(`event: done\ndata: ${JSON.stringify(summary)}\n\n`),
      );
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "x-user-id": userId,
    },
  });
}

function buildFallbackCalendar(body: Record<string, unknown>) {
  const channels = Array.isArray(body?.channels)
    ? (body.channels as string[])
    : ["general"];
  const start =
    typeof body?.start === "string"
      ? new Date(body.start)
      : new Date();
  const cadence = typeof body?.cadence === "string" ? body.cadence : "weekly";

  const pieces: Array<Record<string, unknown>> = [];
  const totalPieces = cadence === "daily" ? 7 : cadence === "monthly" ? 4 : 6;

  for (let i = 0; i < totalPieces; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i * (cadence === "monthly" ? 7 : 1));
    const channel = channels[i % channels.length] ?? "general";

    pieces.push({
      id: randomUUID(),
      title: `Publicación ${i + 1}`,
      channel,
      format: "post",
      copy: "Borrador generado localmente. Ajusta el mensaje para tu marca.",
      script: "Introducción\nDesarrollo\nCTA",
      targetAudience: "Audiencia principal",
      date: date.toISOString().slice(0, 10),
      time: "09:00",
      hashtags: ["calendario", channel],
    });
  }

  return pieces;
}
