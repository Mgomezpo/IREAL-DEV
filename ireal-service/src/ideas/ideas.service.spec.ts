import { ApiHttpException } from '../common/envelope';
import { SupabaseService } from '../common/supabase/supabase.service';
import { IdeasService } from './ideas.service';
import { ListIdeasQueryDto } from './dto/list-ideas-query.dto';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { UpdateIdeaDto } from './dto/update-idea.dto';

type SupabaseBuilder = {
  select: jest.Mock;
  eq: jest.Mock;
  order: jest.Mock;
  or: jest.Mock;
  range: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  single: jest.Mock;
  maybeSingle: jest.Mock;
  in: jest.Mock;
};

const createBuilder = (): SupabaseBuilder => {
  const builder: SupabaseBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    range: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
    in: jest.fn().mockReturnThis(),
  };

  return builder;
};

const buildIdeaRow = () => ({
  id: 'idea-1',
  user_id: 'user-1',
  title: 'My idea',
  content: 'Content',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
});

const createListQuery = (values: Partial<ListIdeasQueryDto> = {}) =>
  Object.assign(new ListIdeasQueryDto(), values);

const createIdeaDto = (values: Partial<CreateIdeaDto> = {}) =>
  Object.assign(new CreateIdeaDto(), values);

const updateIdeaDto = (values: Partial<UpdateIdeaDto> = {}) =>
  Object.assign(new UpdateIdeaDto(), values);

describe('IdeasService', () => {
  let service: IdeasService;
  let supabaseService: jest.Mocked<SupabaseService>;
  let fromMock: jest.Mock;

  beforeEach(() => {
    fromMock = jest.fn();
    supabaseService = {
      getClient: jest.fn().mockReturnValue({ from: fromMock } as any),
    } as unknown as jest.Mocked<SupabaseService>;
    service = new IdeasService(supabaseService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('listIdeas', () => {
    it('returns ideas with pagination metadata', async () => {
      const builder = createBuilder();
      builder.range.mockResolvedValue({
        data: [buildIdeaRow()],
        error: null,
        count: 1,
      });
      fromMock.mockReturnValue(builder as unknown as never);

      const result = await service.listIdeas(
        'user-1',
        createListQuery({ q: 'idea', limit: 10, offset: 0 }),
      );

      expect(builder.range).toHaveBeenCalledWith(0, 9);
      expect(result.data?.items).toHaveLength(1);
      expect(result.data?.pagination.total).toBe(1);
    });

    it('throws ApiHttpException when Supabase returns an error', async () => {
      const builder = createBuilder();
      builder.range.mockResolvedValue({
        data: null,
        error: { message: 'boom' },
        count: null,
      });
      fromMock.mockReturnValue(builder as unknown as never);

      await expect(
        service.listIdeas('user-1', createListQuery()),
      ).rejects.toBeInstanceOf(ApiHttpException);
    });
  });

  describe('getIdeaById', () => {
    it('returns an idea when it exists', async () => {
      const builder = createBuilder();
      builder.maybeSingle.mockResolvedValue({
        data: buildIdeaRow(),
        error: null,
      });
      fromMock.mockReturnValue(builder as unknown as never);

      const result = await service.getIdeaById('user-1', 'idea-1');

      expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(result.data?.id).toBe('idea-1');
    });

    it('throws when an idea is not found', async () => {
      const builder = createBuilder();
      builder.maybeSingle.mockResolvedValue({ data: null, error: null });
      fromMock.mockReturnValue(builder as unknown as never);

      await expect(
        service.getIdeaById('user-1', 'missing'),
      ).rejects.toBeInstanceOf(ApiHttpException);
    });
  });

  describe('createIdea', () => {
    it('persists an idea and returns the envelope', async () => {
      const builder = createBuilder();
      builder.single.mockResolvedValue({ data: buildIdeaRow(), error: null });
      fromMock.mockReturnValue(builder as unknown as never);

      const result = await service.createIdea(
        'user-1',
        createIdeaDto({ title: ' New idea ', content: 'Body' }),
      );

      expect(builder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          title: 'New idea',
        }),
      );
      expect(result.data?.id).toBe('idea-1');
    });

    it('uses Sin titulo fallback when title is empty', async () => {
      const builder = createBuilder();
      builder.single.mockResolvedValue({ data: buildIdeaRow(), error: null });
      fromMock.mockReturnValue(builder as unknown as never);

      await service.createIdea('user-1', createIdeaDto({ title: '   ' }));

      expect(builder.insert).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Sin titulo' }),
      );
    });

    it('throws when Supabase fails to create an idea', async () => {
      const builder = createBuilder();
      builder.single.mockResolvedValue({
        data: null,
        error: { message: 'fail' },
      });
      fromMock.mockReturnValue(builder as unknown as never);

      await expect(
        service.createIdea('user-1', createIdeaDto({ title: 'x' })),
      ).rejects.toBeInstanceOf(ApiHttpException);
    });
  });

  describe('updateIdea', () => {
    it('updates an idea and returns the envelope', async () => {
      const builder = createBuilder();
      builder.maybeSingle.mockResolvedValue({
        data: buildIdeaRow(),
        error: null,
      });
      fromMock.mockReturnValue(builder as unknown as never);

      const result = await service.updateIdea(
        'user-1',
        'idea-1',
        updateIdeaDto({ title: ' Updated ' }),
      );

      expect(builder.update).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Updated' }),
      );
      expect(result.data?.id).toBe('idea-1');
    });

    it('throws when Supabase returns an error', async () => {
      const builder = createBuilder();
      builder.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'fail' },
      });
      fromMock.mockReturnValue(builder as unknown as never);

      await expect(
        service.updateIdea('user-1', 'idea-1', updateIdeaDto({ title: 'x' })),
      ).rejects.toBeInstanceOf(ApiHttpException);
    });

    it('throws when the idea does not exist', async () => {
      const builder = createBuilder();
      builder.maybeSingle.mockResolvedValue({ data: null, error: null });
      fromMock.mockReturnValue(builder as unknown as never);

      await expect(
        service.updateIdea('user-1', 'idea-1', updateIdeaDto({ title: 'x' })),
      ).rejects.toBeInstanceOf(ApiHttpException);
    });
  });

  describe('deleteIdea', () => {
    it('deletes an idea successfully', async () => {
      const builder = createBuilder();
      builder.maybeSingle.mockResolvedValue({
        data: { id: 'idea-1' },
        error: null,
      });
      fromMock.mockReturnValue(builder as unknown as never);

      await expect(
        service.deleteIdea('user-1', 'idea-1'),
      ).resolves.toBeUndefined();

      expect(builder.delete).toHaveBeenCalled();
    });

    it('throws when Supabase returns an error', async () => {
      const builder = createBuilder();
      builder.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'fail' },
      });
      fromMock.mockReturnValue(builder as unknown as never);

      await expect(
        service.deleteIdea('user-1', 'idea-1'),
      ).rejects.toBeInstanceOf(ApiHttpException);
    });

    it('throws when the idea does not exist', async () => {
      const builder = createBuilder();
      builder.maybeSingle.mockResolvedValue({ data: null, error: null });
      fromMock.mockReturnValue(builder as unknown as never);

      await expect(
        service.deleteIdea('user-1', 'idea-1'),
      ).rejects.toBeInstanceOf(ApiHttpException);
    });
  });

  describe('attachPlans', () => {
    it('replaces plan relationships for an idea', async () => {
      const ideaBuilder = createBuilder();
      ideaBuilder.maybeSingle.mockResolvedValue({
        data: buildIdeaRow(),
        error: null,
      });

      const eqMock = jest.fn().mockResolvedValue({ data: null, error: null });
      const detachBuilder = {
        delete: jest.fn().mockReturnValue({ eq: eqMock }),
      };

      const planEqMock = jest.fn().mockResolvedValue({
        data: [{ id: 'plan-1' }, { id: 'plan-2' }],
        error: null,
      });
      const planBuilder = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        eq: planEqMock,
      };

      const insertMock = jest.fn().mockResolvedValue({ error: null });
      const attachBuilder = {
        insert: insertMock,
      };

      fromMock
        .mockImplementationOnce(() => ideaBuilder as unknown as never)
        .mockImplementationOnce(() => detachBuilder as unknown as never)
        .mockImplementationOnce(() => planBuilder as unknown as never)
        .mockImplementationOnce(() => attachBuilder as unknown as never);

      const result = await service.attachPlans('user-1', 'idea-1', {
        planIds: ['plan-1', 'plan-2'],
      });

      expect(eqMock).toHaveBeenCalledWith('idea_id', 'idea-1');
      expect(planBuilder.select).toHaveBeenCalledWith('id');
      expect(planBuilder.in).toHaveBeenCalledWith('id', ['plan-1', 'plan-2']);
      expect(planEqMock).toHaveBeenCalledWith('user_id', 'user-1');
      expect(insertMock).toHaveBeenCalledWith([
        { idea_id: 'idea-1', plan_id: 'plan-1' },
        { idea_id: 'idea-1', plan_id: 'plan-2' },
      ]);
      expect(result.data?.linkedPlanIds).toEqual(['plan-1', 'plan-2']);
    });

    it('throws when detaching existing relationships fails', async () => {
      const ideaBuilder = createBuilder();
      ideaBuilder.maybeSingle.mockResolvedValue({
        data: buildIdeaRow(),
        error: null,
      });

      const detachBuilder = {
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'detach fail' },
          }),
        }),
      };

      fromMock
        .mockImplementationOnce(() => ideaBuilder as unknown as never)
        .mockImplementationOnce(() => detachBuilder as unknown as never);

      await expect(
        service.attachPlans('user-1', 'idea-1', { planIds: ['plan-1'] }),
      ).rejects.toBeInstanceOf(ApiHttpException);
    });

    it('throws when attaching new relationships fails', async () => {
      const ideaBuilder = createBuilder();
      ideaBuilder.maybeSingle.mockResolvedValue({
        data: buildIdeaRow(),
        error: null,
      });

      const eqMock = jest.fn().mockResolvedValue({ data: null, error: null });
      const detachBuilder = {
        delete: jest.fn().mockReturnValue({ eq: eqMock }),
      };

      const planEqMock = jest.fn().mockResolvedValue({
        data: [{ id: 'plan-1' }],
        error: null,
      });
      const planBuilder = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        eq: planEqMock,
      };

      const attachBuilder = {
        insert: jest.fn().mockResolvedValue({
          error: { message: 'attach fail' },
        }),
      };

      fromMock
        .mockImplementationOnce(() => ideaBuilder as unknown as never)
        .mockImplementationOnce(() => detachBuilder as unknown as never)
        .mockImplementationOnce(() => planBuilder as unknown as never)
        .mockImplementationOnce(() => attachBuilder as unknown as never);

      await expect(
        service.attachPlans('user-1', 'idea-1', { planIds: ['plan-1'] }),
      ).rejects.toBeInstanceOf(ApiHttpException);
    });

    it('rejects plan IDs that do not belong to the user', async () => {
      const ideaBuilder = createBuilder();
      ideaBuilder.maybeSingle.mockResolvedValue({
        data: buildIdeaRow(),
        error: null,
      });

      const detachEqMock = jest
        .fn()
        .mockResolvedValue({ data: null, error: null });
      const detachBuilder = {
        delete: jest.fn().mockReturnValue({ eq: detachEqMock }),
      };

      const planEqMock = jest.fn().mockResolvedValue({
        data: [{ id: 'plan-1' }],
        error: null,
      });
      const planBuilder = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        eq: planEqMock,
      };

      fromMock
        .mockImplementationOnce(() => ideaBuilder as unknown as never)
        .mockImplementationOnce(() => detachBuilder as unknown as never)
        .mockImplementationOnce(() => planBuilder as unknown as never);

      await expect(
        service.attachPlans('user-1', 'idea-1', {
          planIds: ['plan-1', 'plan-2'],
        }),
      ).rejects.toBeInstanceOf(ApiHttpException);
    });

    it('throws when the idea does not exist', async () => {
      const ideaBuilder = createBuilder();
      ideaBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });
      fromMock.mockImplementationOnce(() => ideaBuilder as unknown as never);

      await expect(
        service.attachPlans('user-1', 'missing', { planIds: [] }),
      ).rejects.toBeInstanceOf(ApiHttpException);
    });
  });
});
