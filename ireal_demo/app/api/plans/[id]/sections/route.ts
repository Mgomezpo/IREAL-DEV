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

export async function GET(request: Request, { params }: { params: { id: string } }) {
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
      const { data: sections, error } = await supabase
        .from("plan_sections")
        .select("*")
        .eq("plan_id", params.id)
        .eq("user_id", user.id)
        .order("order_index", { ascending: true });

      if (error) throw error;

      return NextResponse.json(sections || []);
    }

    try {
      const response = await callService(`${SERVICE_BASE_PATH}/${params.id}/sections`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
      });

      const envelope = await response.json();
      if (!response.ok) {
        if (response.status >= 500) {
          console.error("[v0] Plans service unavailable (sections GET). Returning empty sections.");
          return NextResponse.json([]);
        }
        return NextResponse.json(envelope, { status: response.status });
      }

      const sections = (envelope?.data as any[])?.map(mapSectionFromService) ?? [];
      const ordered = sections.slice().sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
      return NextResponse.json(ordered);
    } catch (serviceError) {
      console.error("[v0] Plans service error (sections GET). Returning empty sections.", serviceError);
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error("[v0] Error fetching sections:", error);
    return NextResponse.json({ error: "Error al cargar secciones" }, { status: 500 });
  }
}

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
    const { title, section_type, content, order_index } = body;

    if (!SERVICE_ENABLED) {
      const { data: section, error } = await supabase
        .from("plan_sections")
        .insert({
          plan_id: params.id,
          user_id: user.id,
          title,
          section_type,
          content: content || {},
          order_index,
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json(section);
    }

    const response = await callService(`${SERVICE_BASE_PATH}/${params.id}/sections`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": user.id,
      },
      body: JSON.stringify({
        title,
        sectionType: section_type,
        content,
        order: order_index,
      }),
    });

    const envelope = await response.json();
    if (!response.ok) {
      return NextResponse.json(envelope, { status: response.status });
    }

    const section = envelope?.data ? mapSectionFromService(envelope.data) : null;
    return NextResponse.json(section);
  } catch (error) {
    console.error("[v0] Error creating section:", error);
    return NextResponse.json({ error: "Error al crear seccion" }, { status: 500 });
  }
}
