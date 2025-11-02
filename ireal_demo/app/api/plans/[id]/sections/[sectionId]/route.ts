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

export async function PATCH(request: Request, { params }: { params: { id: string; sectionId: string } }) {
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
    const { title, content, order_index, section_type } = body;

    if (!SERVICE_ENABLED) {
      const updateData: Record<string, any> = {};
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;
      if (order_index !== undefined) updateData.order_index = order_index;
      if (section_type !== undefined) updateData.section_type = section_type;

      const { data: section, error } = await supabase
        .from("plan_sections")
        .update(updateData)
        .eq("id", params.sectionId)
        .eq("plan_id", params.id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json(section);
    }

    const response = await callService(`${SERVICE_BASE_PATH}/${params.id}/sections/${params.sectionId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": user.id,
      },
      body: JSON.stringify({
        title,
        content,
        order: order_index,
        sectionType: section_type,
      }),
    });

    const envelope = await response.json();
    if (!response.ok) {
      return NextResponse.json(envelope, { status: response.status });
    }

    const section = envelope?.data ? mapSectionFromService(envelope.data) : null;
    return NextResponse.json(section);
  } catch (error) {
    console.error("[v0] Error updating section:", error);
    return NextResponse.json({ error: "Error al actualizar seccion" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string; sectionId: string } }) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!SERVICE_ENABLED) {
      const { error } = await supabase
        .from("plan_sections")
        .delete()
        .eq("id", params.sectionId)
        .eq("plan_id", params.id)
        .eq("user_id", user.id);

      if (error) throw error;

      return NextResponse.json({ success: true });
    }

    const response = await callService(`${SERVICE_BASE_PATH}/${params.id}/sections/${params.sectionId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": user.id,
      },
    });

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const envelope = await response.json();
    return NextResponse.json(envelope, { status: response.status });
  } catch (error) {
    console.error("[v0] Error deleting section:", error);
    return NextResponse.json({ error: "Error al eliminar seccion" }, { status: 500 });
  }
}