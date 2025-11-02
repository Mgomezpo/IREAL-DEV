import { ApiHttpException } from '../common/envelope';
import { SupabaseService } from '../common/supabase/supabase.service';
import { PlansService } from './plans.service';

const createPlansBuilder = () => {
  const builder: Record<string, jest.Mock> = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn(),
    order: jest.fn(),
  };
  return builder;
};

describe('PlansService', () => {
  let service: PlansService;
  let supabaseService: jest.Mocked<SupabaseService>;
  let client: { from: jest.Mock };

  beforeEach(() => {
    client = { from: jest.fn() };
    supabaseService = {
      getClient: jest.fn().mockReturnValue(client),
    } as unknown as jest.Mocked<SupabaseService>;
    service = new PlansService(supabaseService);
  });

  describe('listPlans', () => {
    it('returns plans with sections mapped to DTO', async () => {
      const plansBuilder = createPlansBuilder();
      plansBuilder.order.mockResolvedValue({
        data: [
          {
            id: 'plan-1',
            user_id: 'user-1',
            name: 'Mi plan',
            description: null,
            status: 'draft',
            channels: ['IG'],
            start_date: null,
            end_date: null,
            created_at: '2024-02-01T00:00:00Z',
            updated_at: '2024-02-01T00:00:00Z',
            plan_sections: [
              {
                id: 'sec-1',
                plan_id: 'plan-1',
                user_id: 'user-1',
                title: 'Resumen ejecutivo',
                content: {},
                section_type: 'summary',
                order_index: 0,
                created_at: '2024-02-01T00:00:00Z',
                updated_at: '2024-02-01T00:00:00Z',
              },
            ],
          },
        ],
        error: null,
      });

      client.from.mockImplementation((table: string) => {
        if (table === 'plans') {
          return plansBuilder;
        }
        throw new Error(`Unexpected table ${table}`);
      });

      const result = await service.listPlans('user-1');

      expect(result.data?.items).toHaveLength(1);
      const plan = result.data?.items[0];
      expect(plan?.name).toBe('Mi plan');
      expect(plan?.sections).toHaveLength(1);
      expect(plansBuilder.select).toHaveBeenCalled();
    });
  });

  describe('reorderSections', () => {
    it('throws when provided section IDs do not match existing', async () => {
      const plansBuilder = createPlansBuilder();
      plansBuilder.maybeSingle.mockResolvedValue({
        data: { id: 'plan-1' },
        error: null,
      });

      const sectionsBuilder: Record<string, jest.Mock> = {
        select: jest.fn().mockReturnThis(),
        eq: jest
          .fn()
          .mockImplementationOnce(() => sectionsBuilder)
          .mockImplementationOnce(() =>
            Promise.resolve({
              data: [{ id: 'sec-1' }],
              error: null,
            }),
          ),
      };

      client.from.mockImplementation((table: string) => {
        if (table === 'plans') {
          return plansBuilder;
        }
        if (table === 'plan_sections') {
          return sectionsBuilder;
        }
        throw new Error(`Unexpected table ${table}`);
      });

      await expect(
        service.reorderSections('user-1', 'plan-1', {
          sectionIds: ['sec-1', 'sec-2'],
        }),
      ).rejects.toBeInstanceOf(ApiHttpException);
    });
  });

  describe('attachIdeas', () => {
    it('rejects when ideas do not belong to user', async () => {
      const plansBuilder = createPlansBuilder();
      plansBuilder.maybeSingle.mockResolvedValue({
        data: { id: 'plan-1' },
        error: null,
      });

      const ideasPlansBuilder = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };

      const ideasBuilder = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{ id: 'idea-1' }],
          error: null,
        }),
      };

      client.from.mockImplementation((table: string) => {
        if (table === 'plans') {
          return plansBuilder;
        }
        if (table === 'ideas_plans') {
          return ideasPlansBuilder;
        }
        if (table === 'ideas') {
          return ideasBuilder;
        }
        throw new Error(`Unexpected table ${table}`);
      });

      await expect(
        service.attachIdeas('user-1', 'plan-1', {
          ideaIds: ['idea-1', 'idea-2'],
        }),
      ).rejects.toBeInstanceOf(ApiHttpException);
    });
  });
});
