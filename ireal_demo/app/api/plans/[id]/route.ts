import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { callService } from "@/lib/service-client";

const SERVICE_ENABLED = process.env.PLANS_SERVICE_ENABLED === "true";
const SERVICE_BASE_PATH = "/v1/plans";

type PlanSectionRow = {
  order_index?: number | null;
  section_type?: string | null;
  content?: any;
  [key: string]: any;
};

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

const mapPlanFromService = (plan: any) => ({
  id: plan.id,
  user_id: plan.userId,
  name: plan.name,
  description: plan.description,
  status: plan.status,
  channels: plan.channels ?? [],
  start_date: plan.startDate,
  end_date: plan.endDate,
  created_at: plan.createdAt,
  updated_at: plan.updatedAt,
  plan_sections: plan.sections ? plan.sections.map(mapSectionFromService) : [],
});

const extractPlanDocFromSections = (sections?: any[] | null) => {
  if (!sections?.length) return null;
  const summary = sections.find((s) => s.section_type === "summary") ?? sections[0];
  const content = summary?.content;
  if (!content || typeof content !== "object") return null;
  return (content as any).plan_doc ?? (content as any).ai_doc ?? null;
};

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

    const loadPlanFromSupabase = async () => {
      const { data: plan, error } = await supabase
        .from("plans")
        .select(
          `
          *,
          plan_sections (
            id,
            title,
            content,
            section_type,
            order_index
          )
        `,
        )
        .eq("id", params.id)
        .eq("user_id", user.id)
        .order("order_index", { referencedTable: "plan_sections", ascending: true })
        .single();

      if (error) throw error;
      if (!plan) return null;

      const sections = ((plan.plan_sections || []) as PlanSectionRow[])
        .slice()
        .sort((a: PlanSectionRow, b: PlanSectionRow) => (a.order_index ?? 0) - (b.order_index ?? 0));
      const progress = calculatePlanProgress(sections);
      const plan_doc = extractPlanDocFromSections(sections);

      return {
        ...plan,
        plan_sections: sections,
        progress,
        ...(plan_doc ? { plan_doc } : {}),
      };
    };

    if (!SERVICE_ENABLED) {
      const plan = await loadPlanFromSupabase();
      if (!plan) {
        return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
      }
      return NextResponse.json(plan);
    }

    try {
      const response = await callService(`${SERVICE_BASE_PATH}/${params.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
      });

      const envelope = await response.json();

      if (!response.ok) {
        if (response.status >= 500) {
          console.error("[v0] Plans service unavailable (GET by id). Falling back to Supabase.");
          const fallbackPlan = await loadPlanFromSupabase().catch(() => null);
          if (fallbackPlan) {
            return NextResponse.json(fallbackPlan);
          }
          return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
        }
        return NextResponse.json(envelope, { status: response.status });
      }

      const plan = envelope?.data ? mapPlanFromService(envelope.data) : null;
      if (!plan) {
        return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
      }

      const sections = (plan.plan_sections || [])
        .slice()
        .sort((a: PlanSectionRow, b: PlanSectionRow) => (a.order_index ?? 0) - (b.order_index ?? 0));
      const progress = calculatePlanProgress(sections);
      const plan_doc = extractPlanDocFromSections(sections);
      return NextResponse.json({
        ...plan,
        plan_sections: sections,
        progress,
        ...(plan_doc ? { plan_doc } : {}),
      });
    } catch (serviceError) {
      console.error("[v0] Plans service error (GET by id). Falling back to Supabase.", serviceError);
      const fallbackPlan = await loadPlanFromSupabase().catch(() => null);
      if (fallbackPlan) {
        return NextResponse.json(fallbackPlan);
      }
      return NextResponse.json({ error: "Error al cargar plan" }, { status: 500 });
    }
  } catch (error) {
    console.error("[v0] Error fetching plan:", error);
    return NextResponse.json({ error: "Error al cargar plan" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
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
    const { name, description, start_date, end_date, channels, status } = body;

    if (!SERVICE_ENABLED) {
      const updateData: Record<string, any> = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (start_date !== undefined) updateData.start_date = start_date;
      if (end_date !== undefined) updateData.end_date = end_date;
      if (channels !== undefined) updateData.channels = channels;
      if (status !== undefined) updateData.status = status;

      const { data: plan, error } = await supabase
        .from("plans")
        .update(updateData)
        .eq("id", params.id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json(plan);
    }

    const response = await callService(`${SERVICE_BASE_PATH}/${params.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": user.id,
      },
      body: JSON.stringify({
        name,
        description,
        startDate: start_date,
        endDate: end_date,
        channels,
        status,
      }),
    });

    const envelope = await response.json();

    if (!response.ok) {
      return NextResponse.json(envelope, { status: response.status });
    }

    const plan = envelope?.data ? mapPlanFromService(envelope.data) : null;
    return NextResponse.json(plan);
  } catch (error) {
    console.error("[v0] Error updating plan:", error);
    return NextResponse.json({ error: "Error al actualizar plan" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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
        .from("plans")
        .delete()
        .eq("id", params.id)
        .eq("user_id", user.id);

      if (error) throw error;

      return NextResponse.json({ success: true });
    }

    const response = await callService(`${SERVICE_BASE_PATH}/${params.id}`, {
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
    console.error("[v0] Error deleting plan:", error);
    return NextResponse.json({ error: "Error al eliminar plan" }, { status: 500 });
  }
}

function calculatePlanProgress(sections: any[]) {
  if (!sections || sections.length === 0) {
    return { doc: 0, schedule: 0, approvals: 0, overall: 0 };
  }

  const docSections = sections.filter((s: any) =>
    ["summary", "goals", "audience", "messages", "pillars", "resources"].includes(s.section_type),
  );
  const scheduleSections = sections.filter((s: any) => ["calendar", "backlog"].includes(s.section_type));
  const approvalSections = sections.filter((s: any) => ["approvals", "kpis"].includes(s.section_type));

  const docProgress = calculateCategoryProgress(docSections);
  const scheduleProgress = calculateCategoryProgress(scheduleSections);
  const approvalsProgress = calculateCategoryProgress(approvalSections);

  const overall = Math.round(docProgress * 0.4 + scheduleProgress * 0.4 + approvalsProgress * 0.2);

  return {
    doc: docProgress,
    schedule: scheduleProgress,
    approvals: approvalsProgress,
    overall,
  };
}

function calculateCategoryProgress(sections: any[]) {
  if (!sections || sections.length === 0) return 0;

  const completedSections = sections.filter((s: any) => {
    const content = s.content;
    if (!content || typeof content !== "object") return false;

    const hasText = content.text && typeof content.text === "string" && content.text.trim().length > 0;
    const hasBlocks = Array.isArray(content.blocks) && content.blocks.length > 0;
    return hasText || hasBlocks;
  });

  return Math.round((completedSections.length / sections.length) * 100);
}
