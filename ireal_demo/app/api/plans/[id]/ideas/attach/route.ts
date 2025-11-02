import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { callService } from "@/lib/service-client";

const SERVICE_ENABLED = process.env.PLANS_SERVICE_ENABLED === "true";
const SERVICE_BASE_PATH = "/v1/plans";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const ideaIds: string[] = Array.isArray(body?.ideaIds) ? body.ideaIds : [];

    if (!SERVICE_ENABLED) {
      const { error: detachError } = await supabase
        .from("ideas_plans")
        .delete()
        .eq("plan_id", params.id);

      if (detachError) throw detachError;

      if (ideaIds.length === 0) {
        return NextResponse.json({ planId: params.id, linkedIdeaIds: [] });
      }

      const { data: ideas, error: ideasError } = await supabase
        .from("ideas")
        .select("id")
        .in("id", ideaIds)
        .eq("user_id", user.id);

      if (ideasError) throw ideasError;

      const foundIds = new Set((ideas || []).map((idea) => idea.id));
      const missing = ideaIds.filter((id) => !foundIds.has(id));

      if (missing.length > 0) {
        return NextResponse.json({ error: "Ideas no accesibles" }, { status: 403 });
      }

      const payload = ideaIds.map((ideaId) => ({ idea_id: ideaId, plan_id: params.id }));
      const { error: attachError } = await supabase.from("ideas_plans").insert(payload);

      if (attachError) throw attachError;

      return NextResponse.json({ planId: params.id, linkedIdeaIds: ideaIds });
    }

    const response = await callService(`${SERVICE_BASE_PATH}/${params.id}/ideas:attach`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": user.id,
      },
      body: JSON.stringify({ ideaIds }),
    });

    const envelope = await response.json();
    if (!response.ok) {
      return NextResponse.json(envelope, { status: response.status });
    }

    return NextResponse.json(envelope?.data ?? { planId: params.id, linkedIdeaIds: [] });
  } catch (error) {
    console.error("[v0] Error attaching ideas to plan:", error);
    return NextResponse.json({ error: "Error al vincular ideas" }, { status: 500 });
  }
}