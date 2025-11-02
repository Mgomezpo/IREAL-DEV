import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callService } from "@/lib/service-client";

const SERVICE_ENABLED = process.env.IDEAS_SERVICE_ENABLED === "true";
const SERVICE_BASE_PATH = "/v1/ideas";

const buildAttachPath = (ideaId: string) => `${SERVICE_BASE_PATH}/${ideaId}/attach-plans`;

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const ideaId = params.id;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const planIds = Array.isArray(body?.planIds) ? (body.planIds as string[]) : undefined;

    if (!planIds) {
      return NextResponse.json({ error: "planIds must be an array" }, { status: 400 });
    }

    if (SERVICE_ENABLED) {
      const response = await callService(buildAttachPath(ideaId), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({ planIds }),
      });

      const envelope = await response.json();

      if (!response.ok) {
        return NextResponse.json(envelope, { status: response.status });
      }

      return NextResponse.json(envelope.data ?? null, { status: response.status });
    }

    const { data: idea, error: ideaError } = await supabase
      .from("ideas")
      .select("id")
      .eq("id", ideaId)
      .eq("user_id", user.id)
      .single();

    if (ideaError || !idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    const { error: detachError } = await supabase
      .from("ideas_plans")
      .delete()
      .eq("idea_id", ideaId);

    if (detachError) {
      console.error("[v0] Database error:", detachError);
      return NextResponse.json({ error: "Failed to attach plans" }, { status: 500 });
    }

    if (planIds.length > 0) {
      const relationships = planIds.map((planId) => ({
        idea_id: ideaId,
        plan_id: planId,
      }));

      const { error: insertError } = await supabase
        .from("ideas_plans")
        .insert(relationships);

      if (insertError) {
        console.error("[v0] Database error:", insertError);
        return NextResponse.json({ error: "Failed to attach plans" }, { status: 500 });
      }
    }

    return NextResponse.json({
      id: ideaId,
      linkedPlanIds: planIds,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[v0] Error attaching plans:", error);
    return NextResponse.json({ error: "Failed to attach plans" }, { status: 500 });
  }
}