import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { callService } from "@/lib/service-client";

// Fuerzo a deshabilitar el servicio externo mientras el esquema de Supabase está desalineado.
const SERVICE_ENABLED = false;
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

type PlanSectionRow = {
  id?: string;
  plan_id?: string;
  user_id?: string;
  title?: string;
  content?: any;
  section_type?: string | null;
  order_index?: number | null;
  created_at?: string;
  updated_at?: string;
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

const buildSectionContentFromDoc = (planDoc: any) => {
  if (!planDoc) return {};
  const text =
    typeof planDoc === "string"
      ? planDoc
      : planDoc.plan_text || planDoc.plan || planDoc.content || "";
  const content: Record<string, any> = {
    plan_doc: planDoc,
    ai_doc: planDoc,
  };
  if (text) {
    content.text = text;
  }
  return content;
};

const extractPlanDocFromSections = (sections?: any[] | null) => {
  if (!sections?.length) return null;
  const summary = sections.find((s) => s.section_type === "summary") ?? sections[0];
  const content = summary?.content;
  if (!content || typeof content !== "object") return null;
  return (content as any).plan_doc ?? (content as any).ai_doc ?? null;
};

const attachPlanDoc = (plan: any) => {
  const plan_doc = extractPlanDocFromSections(plan?.plan_sections);
  return plan_doc ? { ...plan, plan_doc } : plan;
};

async function persistPlanDocToService(
  userId: string,
  planId: string,
  summarySectionId: string | undefined,
  planDoc: any,
) {
  if (!summarySectionId || !planDoc) return;
  try {
    await callService(`${SERVICE_BASE_PATH}/${planId}/sections/${summarySectionId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
      },
      body: JSON.stringify({ content: buildSectionContentFromDoc(planDoc) }),
    });
  } catch (error) {
    console.error("[v0] Failed to persist plan doc via service", error);
  }
}

async function fetchPlansFromSupabase(supabase: Awaited<ReturnType<typeof createServerClient>>, userId: string) {
  try {
    const { data: plans, error } = await supabase
      .from("plans")
      .select(
        `
        *,
        plan_sections (
          id,
          title,
          content,
          order_index
        )
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .order("order_index", { referencedTable: "plan_sections", ascending: true });

    if (error) throw error;

    return (
      plans?.map((plan) => {
        const orderedSections = ((plan.plan_sections || []) as PlanSectionRow[])
          .slice()
          .sort((a: PlanSectionRow, b: PlanSectionRow) => (a.order_index ?? 0) - (b.order_index ?? 0));
        return attachPlanDoc({
          ...plan,
          plan_sections: orderedSections,
          progress: calculatePlanProgress(orderedSections),
        });
      }) ?? []
    );
  } catch (err) {
    console.error("[plans] Supabase fetch error, returning empty list", err);
    return [];
  }
}

async function createPlanInSupabase({
  supabase,
  userId,
  name,
  description,
  start_date,
  end_date,
  channels,
  status,
  planDoc,
  initialIdeaIds,
}: {
  supabase: Awaited<ReturnType<typeof createServerClient>>;
  userId: string;
  name: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  channels?: string[] | null;
  status?: string | null;
  planDoc?: any;
  initialIdeaIds: string[];
}) {
  const { data: plan, error: planError } = await supabase
    .from("plans")
    .insert({
      user_id: userId,
      name,
      description,
      start_date,
      end_date,
      channels: channels ?? [],
      status: status || "draft",
    })
    .select()
    .single();

  if (planError) throw planError;

  const sectionsToInsert = DEFAULT_SECTIONS.map((section) => ({
    plan_id: plan.id,
    user_id: userId,
    ...section,
    // omit section_type to avoid schema mismatch
    section_type: undefined,
    content: section.section_type === "summary" ? buildSectionContentFromDoc(planDoc) : {},
  }));

  const sanitizedSections = sectionsToInsert.map(({ section_type, ...rest }) => rest);

  const { error: sectionsError } = await supabase.from("plan_sections").insert(sanitizedSections);
  if (sectionsError) throw sectionsError;

  if (initialIdeaIds.length > 0) {
    const { data: ideas, error: ideasError } = await supabase
      .from("ideas")
      .select("id")
      .in("id", initialIdeaIds)
      .eq("user_id", userId);

    if (ideasError) throw ideasError;

    const foundIds = new Set((ideas ?? []).map((idea) => idea.id));
    const validIdeaIds = initialIdeaIds.filter((id) => foundIds.has(id));

    if (validIdeaIds.length > 0) {
      const payload = validIdeaIds.map((ideaId) => ({
        idea_id: ideaId,
        plan_id: plan.id,
      }));
      const { error: attachError } = await supabase.from("ideas_plans").insert(payload);
      if (attachError) throw attachError;
    }
  }

  const { data: sections } = await supabase
    .from("plan_sections")
    .select("id, title, content, order_index")
    .eq("plan_id", plan.id)
    .eq("user_id", userId)
    .order("order_index", { ascending: true });

  return attachPlanDoc({
    ...plan,
    plan_sections: sections ?? [],
  });
}

export async function GET() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      // Fallback: no auth, return lista vacia para no romper UI
      return NextResponse.json([]);
    }

    const loadFromSupabase = () => fetchPlansFromSupabase(supabase, user.id);

    if (!SERVICE_ENABLED) {
      return NextResponse.json(await loadFromSupabase());
    }

    try {
      const response = await callService(SERVICE_BASE_PATH, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
      });

      const envelope = await response.json();

      if (!response.ok) {
        if (response.status >= 500) {
          console.error("[v0] Plans service unavailable, falling back to Supabase");
          return NextResponse.json(await loadFromSupabase());
        }
        return NextResponse.json(envelope, { status: response.status });
      }

      const plans =
        (envelope?.data?.items as any[])?.map((plan) => {
          const mapped = mapPlanFromService(plan);
          const orderedSections = (mapped.plan_sections as PlanSectionRow[])
            .slice()
            .sort((a: PlanSectionRow, b: PlanSectionRow) => (a.order_index ?? 0) - (b.order_index ?? 0));
          return attachPlanDoc({ ...mapped, plan_sections: orderedSections });
        }) ?? [];
      const withProgress = plans.map((plan) => ({
        ...plan,
        progress: calculatePlanProgress(plan.plan_sections || []),
      }));

      return NextResponse.json(withProgress);
    } catch (serviceError) {
      console.error("[v0] Plans service error (GET). Falling back to Supabase.", serviceError);
      const fallbackPlans = await loadFromSupabase().catch(() => []);
      return NextResponse.json(fallbackPlans);
    }
  } catch (error) {
    console.error("[v0] Error fetching plans:", error);
    return NextResponse.json({ error: "Error al cargar planes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, start_date, end_date, channels, status } = body;
    const planDoc = body?.planDoc ?? body?.plan_doc ?? body?.aiDoc ?? null;
    const initialIdeaIds = Array.isArray(body?.initialIdeaIds)
      ? Array.from(new Set((body.initialIdeaIds as string[]).filter((id) => typeof id === "string")))
      : [];

    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      // Fallback: si no hay sesion, devolvemos un plan temporal (no persistente)
      const fallbackPlan = {
        id: `local-${Date.now()}`,
        user_id: "anon",
        name: name ?? "Plan sin nombre",
        description: description ?? null,
        status: status ?? "draft",
        channels: [],
        start_date: null,
        end_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        plan_sections: [],
      };
      return NextResponse.json(fallbackPlan);
    }

    if (!SERVICE_ENABLED) {
      try {
        const plan = await createPlanInSupabase({
          supabase,
          userId: user.id,
          name,
          description,
          start_date,
          end_date,
          channels,
          status,
          planDoc,
          initialIdeaIds,
        });

        return NextResponse.json(plan);
      } catch (supabaseError) {
        console.error("[plans] Supabase create failed, returning local draft.", supabaseError);
        const fallbackPlan = {
          id: `local-${Date.now()}`,
          user_id: user.id,
          name: name ?? "Plan sin nombre",
          description: description ?? null,
          status: status ?? "draft",
          start_date: start_date ?? null,
          end_date: end_date ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          plan_sections: DEFAULT_SECTIONS.map((s) => ({ ...s, content: {} })),
        };
        return NextResponse.json(attachPlanDoc({ ...fallbackPlan, plan_doc: planDoc ?? undefined }));
      }
    }

    try {
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
          // omit channels to avoid schemas without the column
          status: status ?? "draft",
          initialIdeaIds,
        }),
      });

      const envelope = await response.json();

      if (!response.ok) {
        if (response.status >= 500) {
          console.error("[v0] Plans service unavailable on create. Falling back to Supabase.");
          const plan = await createPlanInSupabase({
            supabase,
            userId: user.id,
            name,
            description,
            start_date,
            end_date,
            channels,
            status,
            planDoc,
            initialIdeaIds,
          });
          return NextResponse.json(plan);
        }
        return NextResponse.json(envelope, { status: response.status });
      }

      const plan = envelope?.data ? mapPlanFromService(envelope.data) : null;
      if (!plan) {
        return NextResponse.json({ error: "Error al crear plan" }, { status: 500 });
      }

      const orderedSections = (plan.plan_sections || [])
        .slice()
        .sort((a: PlanSectionRow, b: PlanSectionRow) => (a.order_index ?? 0) - (b.order_index ?? 0));
      const planWithSections = { ...plan, plan_sections: orderedSections };

      const summarySectionId = orderedSections.find((s: any) => s.section_type === "summary")?.id;
      if (planDoc) {
        await persistPlanDocToService(user.id, plan.id, summarySectionId, planDoc);
      }

      return NextResponse.json(attachPlanDoc({ ...planWithSections, plan_doc: planDoc ?? undefined }));
    } catch (serviceError) {
      console.error("[v0] Plans service error (POST). Falling back to Supabase.", serviceError);
      const plan = await createPlanInSupabase({
        supabase,
        userId: user.id,
        name,
        description,
        start_date,
        end_date,
        channels,
        status,
        planDoc,
        initialIdeaIds,
      });
      return NextResponse.json(plan);
    }
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
