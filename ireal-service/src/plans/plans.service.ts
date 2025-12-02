import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { ApiHttpException, buildSuccess } from '../common/envelope';
import { CreatePlanDto, PLAN_STATUSES } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import type { Database } from '../common/supabase/supabase.types';
import { PlanDto, PlanSectionDto, PlansListDto } from './dto/plan-response.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { ReorderSectionsDto } from './dto/reorder-sections.dto';
import { AttachIdeasDto } from './dto/attach-ideas.dto';

type PlanRow = Database['public']['Tables']['plans']['Row'];
type PlanInsert = Database['public']['Tables']['plans']['Insert'];
type PlanUpdate = Database['public']['Tables']['plans']['Update'];
type SectionRow = Database['public']['Tables']['plan_sections']['Row'];
type SectionInsert = Database['public']['Tables']['plan_sections']['Insert'];

const DEFAULT_SECTIONS: Array<{
  title: string;
  sectionType: string;
}> = [
  { title: 'Resumen ejecutivo', sectionType: 'summary' },
  { title: 'Objetivos (SMART)', sectionType: 'goals' },
  { title: 'Audiencia & ICP', sectionType: 'audience' },
  { title: 'Propuesta de valor & Mensajes', sectionType: 'messages' },
  { title: 'Pilares de contenido', sectionType: 'pillars' },
  { title: 'Calendario', sectionType: 'calendar' },
  { title: 'Backlog de piezas', sectionType: 'backlog' },
  { title: 'KPIs & Métricas', sectionType: 'kpis' },
  { title: 'Recursos & Presupuesto', sectionType: 'resources' },
  { title: 'Aprobaciones & Notas', sectionType: 'approvals' },
];

const normalizeStatus = (
  status: string | null,
): (typeof PLAN_STATUSES)[number] => {
  if (!status) {
    return 'draft';
  }

  return PLAN_STATUSES.includes(status as (typeof PLAN_STATUSES)[number])
    ? (status as (typeof PLAN_STATUSES)[number])
    : 'draft';
};

const mapSection = (record: SectionRow): PlanSectionDto => ({
  id: record.id,
  planId: record.plan_id,
  title: record.title,
  sectionType: record.section_type,
  content: record.content ?? null,
  order: record.order_index ?? 0,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
});

const mapPlan = (record: PlanRow, sections?: SectionRow[]): PlanDto => {
  const sortedSections = sections
    ? [...sections].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    : undefined;

  return {
    id: record.id,
    userId: record.user_id,
    name: record.name,
    description: record.description ?? null,
    status: normalizeStatus(record.status),
    channels: record.channels ?? null,
    startDate: record.start_date ?? null,
    endDate: record.end_date ?? null,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    sections: sortedSections ? sortedSections.map(mapSection) : undefined,
  };
};

@Injectable()
export class PlansService {
  private readonly logger = new Logger(PlansService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async listPlans(userId: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('plans')
      .select(
        `
        *,
        plan_sections (
          id,
          plan_id,
          user_id,
          title,
          content,
          section_type,
          order_index,
          created_at,
          updated_at
        )
      `,
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new ApiHttpException(
        'PLANS_LIST_FAILED',
        error.message ?? 'Failed to retrieve plans',
        HttpStatus.BAD_GATEWAY,
      );
    }

    const payload: PlansListDto = {
      items:
        data?.map((row: PlanRow & { plan_sections?: SectionRow[] }) =>
          mapPlan(row, row.plan_sections ?? []),
        ) ?? [],
    };

    return buildSuccess<PlansListDto>(payload, { domain: 'plans' });
  }

  async getPlanById(userId: string, planId: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('plans')
      .select(
        `
        *,
        plan_sections (
          id,
          plan_id,
          user_id,
          title,
          content,
          section_type,
          order_index,
          created_at,
          updated_at
        )
      `,
      )
      .eq('id', planId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new ApiHttpException(
        'PLAN_LOOKUP_FAILED',
        error.message ?? 'Failed to fetch plan',
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (!data) {
      throw new ApiHttpException(
        'PLAN_NOT_FOUND',
        'Plan not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const plan = mapPlan(
      data as PlanRow,
      (data as PlanRow & { plan_sections?: SectionRow[] }).plan_sections ?? [],
    );

    return buildSuccess<PlanDto>(plan, { domain: 'plans', id: planId });
  }

  async createPlan(userId: string, dto: CreatePlanDto) {
    const client = this.supabase.getClient();

    const planPayload: PlanInsert = {
      user_id: userId,
      name: dto.name.trim(),
      description: dto.description ?? null,
      status: dto.status ?? 'draft',
      start_date: dto.startDate ?? null,
      end_date: dto.endDate ?? null,
    };

    const planResult = await client
      .from('plans')
      .insert(planPayload)
      .select('*')
      .single();

    if (planResult.error || !planResult.data) {
      throw new ApiHttpException(
        'PLAN_CREATE_FAILED',
        'Failed to create plan',
        HttpStatus.BAD_GATEWAY,
      );
    }

    const plan = planResult.data as PlanRow;

    const sectionInserts: SectionInsert[] = [];

    DEFAULT_SECTIONS.forEach((section, index) => {
      sectionInserts.push({
        plan_id: plan.id,
        user_id: userId,
        title: section.title,
        section_type: section.sectionType,
        content: {},
        order_index: index,
      });
    });

    const sectionsResult = await client
      .from('plan_sections')
      .insert(sectionInserts);

    if (sectionsResult.error) {
      throw new ApiHttpException(
        'PLAN_SECTIONS_CREATE_FAILED',
        'Failed to create default sections',
        HttpStatus.BAD_GATEWAY,
      );
    }

    const initialIdeaIds = dto.initialIdeaIds ?? [];
    if (initialIdeaIds.length > 0) {
      const uniqueIdeaIds = Array.from(new Set(initialIdeaIds));
      const payload = uniqueIdeaIds.map((ideaId) => ({
        idea_id: ideaId,
        plan_id: plan.id,
      }));

      const { error: attachError } = await client
        .from('ideas_plans')
        .insert(payload);

      if (attachError) {
        this.logger.error(
          `Failed to link initial ideas to plan ${plan.id}: ${attachError.message}`,
        );
      }
    }

    return this.getPlanById(userId, plan.id);
  }

  async updatePlan(userId: string, planId: string, dto: UpdatePlanDto) {
    const client = this.supabase.getClient();

    const updatePayload: PlanUpdate = {
      updated_at: new Date().toISOString(),
    };

    if (dto.name !== undefined) {
      updatePayload.name = dto.name.trim();
    }

    if (dto.description !== undefined) {
      updatePayload.description = dto.description ?? null;
    }

    if (dto.status !== undefined) {
      updatePayload.status = dto.status;
    }

    if (dto.channels !== undefined) {
      // Column may not exist in some schemas; skip to avoid PGRST204 errors
    }

    if (dto.startDate !== undefined) {
      updatePayload.start_date = dto.startDate ?? null;
    }

    if (dto.endDate !== undefined) {
      updatePayload.end_date = dto.endDate ?? null;
    }

    const { data, error } = await client
      .from('plans')
      .update(updatePayload)
      .eq('id', planId)
      .eq('user_id', userId)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new ApiHttpException(
        'PLAN_UPDATE_FAILED',
        error.message ?? 'Failed to update plan',
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (!data) {
      throw new ApiHttpException(
        'PLAN_NOT_FOUND',
        'Plan not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.getPlanById(userId, planId);
  }

  async deletePlan(userId: string, planId: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('plans')
      .delete()
      .eq('id', planId)
      .eq('user_id', userId)
      .select('id')
      .maybeSingle();

    if (error) {
      throw new ApiHttpException(
        'PLAN_DELETE_FAILED',
        error.message ?? 'Failed to delete plan',
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (!data) {
      throw new ApiHttpException(
        'PLAN_NOT_FOUND',
        'Plan not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return buildSuccess(
      { id: planId },
      { domain: 'plans', id: planId, deleted: true },
    );
  }

  async listSections(userId: string, planId: string) {
    await this.ensurePlanOwnership(userId, planId);
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('plan_sections')
      .select('*')
      .eq('plan_id', planId)
      .eq('user_id', userId)
      .order('order_index', { ascending: true });

    if (error) {
      throw new ApiHttpException(
        'PLAN_SECTIONS_LIST_FAILED',
        error.message ?? 'Failed to fetch plan sections',
        HttpStatus.BAD_GATEWAY,
      );
    }

    const sections = (data ?? []).map(mapSection);
    return buildSuccess(sections, { domain: 'plan_sections', id: planId });
  }

  async createSection(userId: string, planId: string, dto: CreateSectionDto) {
    await this.ensurePlanOwnership(userId, planId);
    const client = this.supabase.getClient();

    let order = dto.order ?? 0;
    if (dto.order === undefined) {
      const { data: lastOrderRow, error: lastOrderError } = await client
        .from('plan_sections')
        .select('order_index')
        .eq('plan_id', planId)
        .eq('user_id', userId)
        .order('order_index', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastOrderError) {
        throw new ApiHttpException(
          'PLAN_SECTION_ORDER_FAILED',
          lastOrderError.message ?? 'Failed to resolve section order',
          HttpStatus.BAD_GATEWAY,
        );
      }

      order = (lastOrderRow?.order_index ?? -1) + 1;
    }

    const insertPayload: SectionInsert = {
      plan_id: planId,
      user_id: userId,
      title: dto.title,
      section_type: dto.sectionType ?? null,
      content: dto.content ?? {},
      order_index: order,
    };

    const { data, error } = await client
      .from('plan_sections')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error || !data) {
      throw new ApiHttpException(
        'PLAN_SECTION_CREATE_FAILED',
        error?.message ?? 'Failed to create plan section',
        HttpStatus.BAD_GATEWAY,
      );
    }

    const section = data as SectionRow;

    return buildSuccess(mapSection(section), {
      domain: 'plan_sections',
      id: section.id,
    });
  }

  async updateSection(
    userId: string,
    planId: string,
    sectionId: string,
    dto: UpdateSectionDto,
  ) {
    await this.ensurePlanOwnership(userId, planId);
    const client = this.supabase.getClient();

    const updatePayload: Partial<SectionInsert> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.title !== undefined) {
      updatePayload.title = dto.title;
    }

    if (dto.sectionType !== undefined) {
      updatePayload.section_type = dto.sectionType ?? null;
    }

    if (dto.content !== undefined) {
      updatePayload.content = dto.content ?? {};
    }

    if (dto.order !== undefined) {
      updatePayload.order_index = dto.order;
    }

    const { data, error } = await client
      .from('plan_sections')
      .update(updatePayload)
      .eq('id', sectionId)
      .eq('plan_id', planId)
      .eq('user_id', userId)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new ApiHttpException(
        'PLAN_SECTION_UPDATE_FAILED',
        error.message ?? 'Failed to update section',
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (!data) {
      throw new ApiHttpException(
        'PLAN_SECTION_NOT_FOUND',
        'Section not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const section = data as SectionRow;

    return buildSuccess(mapSection(section), {
      domain: 'plan_sections',
      id: sectionId,
    });
  }

  async deleteSection(userId: string, planId: string, sectionId: string) {
    await this.ensurePlanOwnership(userId, planId);
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('plan_sections')
      .delete()
      .eq('id', sectionId)
      .eq('plan_id', planId)
      .eq('user_id', userId)
      .select('id')
      .maybeSingle();

    if (error) {
      throw new ApiHttpException(
        'PLAN_SECTION_DELETE_FAILED',
        error.message ?? 'Failed to delete section',
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (!data) {
      throw new ApiHttpException(
        'PLAN_SECTION_NOT_FOUND',
        'Section not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return buildSuccess(
      { id: sectionId },
      { domain: 'plan_sections', id: sectionId, deleted: true },
    );
  }

  async reorderSections(
    userId: string,
    planId: string,
    dto: ReorderSectionsDto,
  ) {
    await this.ensurePlanOwnership(userId, planId);

    const orderedIds = dto.sectionIds.map((id) => id.trim());
    const uniqueIds = Array.from(new Set(orderedIds));

    const client = this.supabase.getClient();
    const { data: existing, error: fetchError } = await client
      .from('plan_sections')
      .select('id')
      .eq('plan_id', planId)
      .eq('user_id', userId);

    if (fetchError) {
      throw new ApiHttpException(
        'PLAN_SECTION_REORDER_FAILED',
        fetchError.message ?? 'Failed to fetch sections for reorder',
        HttpStatus.BAD_GATEWAY,
      );
    }

    const existingIds = new Set((existing ?? []).map((s) => s.id));

    if (uniqueIds.length !== existingIds.size) {
      throw new ApiHttpException(
        'PLAN_SECTION_MISMATCH',
        'Section IDs must match the current plan sections exactly',
        HttpStatus.BAD_REQUEST,
      );
    }

    const missing = uniqueIds.filter((id) => !existingIds.has(id));
    if (missing.length > 0) {
      throw new ApiHttpException(
        'PLAN_SECTION_MISMATCH',
        'Section IDs must match the current plan sections exactly',
        HttpStatus.BAD_REQUEST,
      );
    }

    const updates = uniqueIds.map((id, index) =>
      client
        .from('plan_sections')
        .update({
          order_index: index,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('plan_id', planId)
        .eq('user_id', userId),
    );

    const results = await Promise.all(updates);
    const updateError = results.find((result) => result.error);
    if (updateError?.error) {
      throw new ApiHttpException(
        'PLAN_SECTION_REORDER_FAILED',
        updateError.error.message ?? 'Failed to reorder sections',
        HttpStatus.BAD_GATEWAY,
      );
    }

    return this.listSections(userId, planId);
  }

  async attachIdeas(userId: string, planId: string, dto: AttachIdeasDto) {
    await this.ensurePlanOwnership(userId, planId);
    const ideaIds = dto.ideaIds ?? [];
    const uniqueIdeaIds = Array.from(new Set(ideaIds));

    const client = this.supabase.getClient();

    const { error: deleteError } = await client
      .from('ideas_plans')
      .delete()
      .eq('plan_id', planId);

    if (deleteError) {
      throw new ApiHttpException(
        'PLAN_ATTACH_FAILED',
        deleteError.message ?? 'Failed to detach existing ideas',
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (uniqueIdeaIds.length === 0) {
      return buildSuccess(
        {
          planId,
          linkedIdeaIds: [],
        },
        { domain: 'plans', id: planId },
      );
    }

    const { data: ideas, error: ideasError } = await client
      .from('ideas')
      .select('id')
      .in('id', uniqueIdeaIds)
      .eq('user_id', userId);

    if (ideasError) {
      throw new ApiHttpException(
        'PLAN_ATTACH_FAILED',
        ideasError.message ?? 'Failed to validate ideas',
        HttpStatus.BAD_GATEWAY,
      );
    }

    const foundIds = new Set((ideas ?? []).map((idea) => idea.id));
    const missingIds = uniqueIdeaIds.filter((id) => !foundIds.has(id));

    if (missingIds.length > 0) {
      throw new ApiHttpException(
        'PLAN_ATTACH_UNAUTHORIZED',
        'One or more ideas are not accessible to the user',
        HttpStatus.FORBIDDEN,
      );
    }

    const payload = uniqueIdeaIds.map((ideaId) => ({
      idea_id: ideaId,
      plan_id: planId,
    }));

    const { error: attachError } = await client
      .from('ideas_plans')
      .insert(payload);

    if (attachError) {
      throw new ApiHttpException(
        'PLAN_ATTACH_FAILED',
        attachError.message ?? 'Failed to attach ideas to plan',
        HttpStatus.BAD_GATEWAY,
      );
    }

    return buildSuccess(
      {
        planId,
        linkedIdeaIds: uniqueIdeaIds,
      },
      { domain: 'plans', id: planId },
    );
  }

  private async ensurePlanOwnership(userId: string, planId: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('plans')
      .select('id')
      .eq('id', planId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new ApiHttpException(
        'PLAN_LOOKUP_FAILED',
        error.message ?? 'Failed to verify plan ownership',
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (!data) {
      throw new ApiHttpException(
        'PLAN_NOT_FOUND',
        'Plan not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
