import { HttpStatus, Injectable } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { ApiHttpException, buildSuccess } from '../common/envelope';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { AttachPlansDto } from './dto/attach-plans.dto';
import { UpdateIdeaDto } from './dto/update-idea.dto';
import { ListIdeasQueryDto } from './dto/list-ideas-query.dto';
import type { PaginatedIdeasDto, IdeaDto } from './dto/idea-response.dto';
import type { Database } from '../common/supabase/supabase.types';

type IdeaRow = Database['public']['Tables']['ideas']['Row'];
type IdeaInsert = Database['public']['Tables']['ideas']['Insert'];
type IdeaUpdate = Database['public']['Tables']['ideas']['Update'];
type IdeaPlanInsert = Database['public']['Tables']['ideas_plans']['Insert'];

const sanitizeSearch = (value: string): string =>
  value.replace(/%/g, '\\%').replace(/_/g, '\\_');

const toStringSafe = (input: unknown, fallback = ''): string => {
  if (input === null || input === undefined) {
    return fallback;
  }

  if (typeof input === 'string') {
    return input;
  }

  if (typeof input === 'number') {
    return input.toString();
  }

  if (input instanceof Date) {
    return input.toISOString();
  }

  return fallback;
};

const mapRecordToIdea = (record: IdeaRow): IdeaDto => ({
  id: record.id,
  userId: record.user_id,
  title: record.title ?? '',
  content: record.content ?? '',
  createdAt: toStringSafe(record.created_at) || new Date().toISOString(),
  updatedAt: toStringSafe(record.updated_at) || new Date().toISOString(),
});

@Injectable()
export class IdeasService {
  constructor(private readonly supabase: SupabaseService) {}

  async listIdeas(userId: string, query: ListIdeasQueryDto) {
    const client = this.supabase.getClient();
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;

    let builder = client
      .from('ideas')
      .select('id, user_id, title, content, created_at, updated_at', {
        count: 'exact',
      })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (query.q) {
      const escaped = sanitizeSearch(query.q);
      builder = builder.or(
        `title.ilike.%${escaped}%,content.ilike.%${escaped}%`,
      );
    }

    const { data, error, count } = await builder.range(
      offset,
      offset + limit - 1,
    );

    if (error) {
      throw new ApiHttpException(
        'IDEAS_LIST_FAILED',
        error.message ?? 'Failed to retrieve ideas',
        HttpStatus.BAD_GATEWAY,
      );
    }

    const ideas = (data ?? []).map(mapRecordToIdea);

    return buildSuccess<PaginatedIdeasDto>(
      {
        items: ideas,
        pagination: {
          total: count ?? ideas.length,
          limit,
          offset,
        },
      },
      { domain: 'ideas' },
    );
  }

  async getIdeaById(userId: string, ideaId: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('ideas')
      .select('id, user_id, title, content, created_at, updated_at')
      .eq('id', ideaId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new ApiHttpException(
        'IDEA_LOOKUP_FAILED',
        error.message ?? 'Failed to fetch idea',
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (!data) {
      throw new ApiHttpException(
        'IDEA_NOT_FOUND',
        'Idea not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return buildSuccess<IdeaDto>(mapRecordToIdea(data), {
      domain: 'ideas',
      id: ideaId,
    });
  }

  async createIdea(userId: string, dto: CreateIdeaDto) {
    const client = this.supabase.getClient();
    const payload: IdeaInsert = {
      user_id: userId,
      title: dto.title?.trim() || 'Sin titulo',
      content: dto.content ?? '',
    };

    const { data, error } = await client
      .from('ideas')
      .insert(payload)
      .select('id, user_id, title, content, created_at, updated_at')
      .single();

    if (error || !data) {
      throw new ApiHttpException(
        'IDEA_CREATE_FAILED',
        error?.message ?? 'Failed to create idea',
        HttpStatus.BAD_GATEWAY,
      );
    }

    return buildSuccess<IdeaDto>(mapRecordToIdea(data), {
      domain: 'ideas',
    });
  }

  async updateIdea(userId: string, ideaId: string, dto: UpdateIdeaDto) {
    const client = this.supabase.getClient();
    const updatePayload: IdeaUpdate & { updated_at: string } = {
      updated_at: new Date().toISOString(),
    };

    if (dto.title !== undefined) {
      updatePayload.title = dto.title.trim() || 'Sin titulo';
    }

    if (dto.content !== undefined) {
      updatePayload.content = dto.content;
    }

    const { data, error } = await client
      .from('ideas')
      .update(updatePayload)
      .eq('id', ideaId)
      .eq('user_id', userId)
      .select('id, user_id, title, content, created_at, updated_at')
      .maybeSingle();

    if (error) {
      throw new ApiHttpException(
        'IDEA_UPDATE_FAILED',
        error.message ?? 'Failed to update idea',
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (!data) {
      throw new ApiHttpException(
        'IDEA_NOT_FOUND',
        'Idea not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return buildSuccess<IdeaDto>(mapRecordToIdea(data), {
      domain: 'ideas',
      id: ideaId,
    });
  }

  async deleteIdea(userId: string, ideaId: string): Promise<void> {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('ideas')
      .delete()
      .eq('id', ideaId)
      .eq('user_id', userId)
      .select('id')
      .maybeSingle();

    if (error) {
      throw new ApiHttpException(
        'IDEA_DELETE_FAILED',
        error.message ?? 'Failed to delete idea',
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (!data) {
      throw new ApiHttpException(
        'IDEA_NOT_FOUND',
        'Idea not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async attachPlans(userId: string, ideaId: string, dto: AttachPlansDto) {
    const client = this.supabase.getClient();
    const { data: idea, error: ideaLookupError } = await client
      .from('ideas')
      .select('id')
      .eq('id', ideaId)
      .eq('user_id', userId)
      .maybeSingle();

    if (ideaLookupError) {
      throw new ApiHttpException(
        'IDEA_LOOKUP_FAILED',
        ideaLookupError.message ?? 'Failed to fetch idea',
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (!idea) {
      throw new ApiHttpException(
        'IDEA_NOT_FOUND',
        'Idea not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const { error: detachError } = await client
      .from('ideas_plans')
      .delete()
      .eq('idea_id', ideaId);

    if (detachError) {
      throw new ApiHttpException(
        'IDEA_ATTACH_FAILED',
        detachError.message ?? 'Failed to detach plans',
        HttpStatus.BAD_GATEWAY,
      );
    }

    const planIds = dto.planIds ?? [];
    const uniquePlanIds = [...new Set(planIds)];

    if (uniquePlanIds.length > 0) {
      const { data: plans, error: plansError } = await client
        .from('plans')
        .select('id')
        .in('id', uniquePlanIds)
        .eq('user_id', userId);

      if (plansError) {
        throw new ApiHttpException(
          'PLAN_LOOKUP_FAILED',
          plansError.message ?? 'Failed to validate plans',
          HttpStatus.BAD_GATEWAY,
        );
      }

      const foundIds = new Set(plans?.map((plan) => plan.id) ?? []);
      const missingIds = uniquePlanIds.filter((id) => !foundIds.has(id));

      if (missingIds.length > 0) {
        throw new ApiHttpException(
          'PLAN_NOT_ACCESSIBLE',
          'One or more plans are not accessible to the user',
          HttpStatus.FORBIDDEN,
        );
      }

      const payload: IdeaPlanInsert[] = uniquePlanIds.map((planId) => ({
        idea_id: ideaId,
        plan_id: planId,
      }));

      const { error: attachError } = await client
        .from('ideas_plans')
        .insert(payload);

      if (attachError) {
        throw new ApiHttpException(
          'IDEA_ATTACH_FAILED',
          attachError.message ?? 'Failed to attach plans',
          HttpStatus.BAD_GATEWAY,
        );
      }
    }

    return buildSuccess(
      {
        id: ideaId,
        linkedPlanIds: uniquePlanIds,
        updatedAt: new Date().toISOString(),
      },
      { domain: 'ideas', id: ideaId },
    );
  }
}
