import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { callService } from "@/lib/service-client";

const SERVICE_ENABLED = process.env.PLANS_SERVICE_ENABLED === "true";
const SERVICE_BASE_PATH = "/v1/plans";

const DEFAULT_SECTIONS = [
  { title: "Resumen ejecutivo", section_type: "summary", order_index: 0 },
  { title: "Objetivos (SMART)", section_type: "goals", order_index: 1 },
  { title: "Audiencia & ICP", section_type: "audience", order_index: 2 },
  { title: "Propuesta de valor & Mensajes", section_type: "messages", order_index: 3 },
  { title: "Pilares de contenido", section_type: "pillars", order_index: 4 },
  { title: "Calendario", section_type: "calendar", order_index: 5 },
  { title: "Backlog de piezas", section_type: "backlog", order_index: 6 },
  { title: "KPIs & Metricas", section_type: "kpis", order_index: 7 },
  { title: "Recursos & Presupuesto", section_type: "resources", order_index: 8 },
  { title: "Aprobaciones & Notas", section_type: "approvals", order_index: 9 },
];

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

export async function GET() {
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
      const { data: plans, error } = await supabase
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
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const plansWithProgress =
        plans?.map((plan) => ({
          ...plan,
          progress: calculatePlanProgress(plan.plan_sections || []),
        })) ?? [];

      return NextResponse.json(plansWithProgress);
    }

    const response = await callService(SERVICE_BASE_PATH, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": user.id,
      },
    });

    const envelope = await response.json();

    if (!response.ok) {
      return NextResponse.json(envelope, { status: response.status });
    }

    const plans = (envelope?.data?.items as any[])?.map(mapPlanFromService) ?? [];
    const withProgress = plans.map((plan) => ({
      ...plan,
      progress: calculatePlanProgress(plan.plan_sections || []),
    }));

    return NextResponse.json(withProgress);
  } catch (error) {
    console.error("[v0] Error fetching plans:", error);
    return NextResponse.json({ error: "Error al cargar planes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
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
      const { data: plan, error: planError } = await supabase
        .from("plans")
        .insert({
          user_id: user.id,
          name,
          description,
          start_date,
          end_date,
          channels: channels || [],
          status: status || "draft",
        })
        .select()
        .single();

      if (planError) throw planError;

      const sectionsToInsert = DEFAULT_SECTIONS.map((section) => ({
        plan_id: plan.id,
        user_id: user.id,
        ...section,
        content: {},
      }));

      const { error: sectionsError } = await supabase
        .from("plan_sections")
        .insert(sectionsToInsert);

      if (sectionsError) throw sectionsError;

      return NextResponse.json(plan);
    }

    const response = await callService(SERVICE_BASE_PATH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": user.id,
      },
      body: JSON.stringify({
        name,
        description,
        startDate: start_date ?? null,
        endDate: end_date ?? null,
        channels: channels ?? [],
        status: status ?? "draft",
      }),
    });

    const envelope = await response.json();

    if (!response.ok) {
      return NextResponse.json(envelope, { status: response.status });
    }

    const plan = envelope?.data ? mapPlanFromService(envelope.data) : null;
    return NextResponse.json(plan);
  } catch (error) {
    console.error("[v0] Error creating plan:", error);
    return NextResponse.json({ error: "Error al crear plan" }, { status: 500 });
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