import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { callService } from "@/lib/service-client";

const SERVICE_ENABLED = process.env.PLANS_SERVICE_ENABLED === "true";
const SERVICE_BASE_PATH = "/v1/plans";

const mapSectionFromService = (section: any) => ({
  id: section.id,
  plan_id: section.planId,
  user_id: section.userId ?? "",
  title: section.title,
  content: section.content ?? {},
  section_type: section.sectionType,
  order_index: section.order ?? 0,
  created_at: section.createdAt,
  updated_at: section.updatedAt,
});

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
    const sectionIds: string[] | undefined = body?.sectionIds;

    if (!SERVICE_ENABLED) {
      if (Array.isArray(sectionIds) && sectionIds.length > 0) {
        const updates = sectionIds.map((sectionId, index) =>
          supabase
            .from("plan_sections")
            .update({ order_index: index })
            .eq("id", sectionId)
            .eq("plan_id", params.id)
            .eq("user_id", user.id),
        );

        const results = await Promise.all(updates);
        const failed = results.find((result) => result.error);
        if (failed?.error) {
          throw failed.error;
        }

        return NextResponse.json({ success: true });
      }

      const sections = Array.isArray(body?.sections) ? body.sections : [];
      if (sections.length === 0) {
        return NextResponse.json({ error: "Payload invalido" }, { status: 400 });
      }

      const updates = sections.map((section: any) =>
        supabase
          .from("plan_sections")
          .update({ order_index: section.order_index })
          .eq("id", section.id)
          .eq("plan_id", params.id)
          .eq("user_id", user.id),
      );

      const results = await Promise.all(updates);
      const failed = results.find((result) => result.error);
      if (failed?.error) {
        throw failed.error;
      }

      return NextResponse.json({ success: true });
    }

    const response = await callService(`${SERVICE_BASE_PATH}/${params.id}/sections:reorder`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": user.id,
      },
      body: JSON.stringify({ sectionIds }),
    });

    const envelope = await response.json();
    if (!response.ok) {
      return NextResponse.json(envelope, { status: response.status });
    }

    const sections = (envelope?.data as any[])?.map(mapSectionFromService) ?? [];
    const ordered = sections.slice().sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
    return NextResponse.json(ordered);
  } catch (error) {
    console.error("[v0] Error reordering sections:", error);
    return NextResponse.json({ error: "Error al reordenar secciones" }, { status: 500 });
  }
}
