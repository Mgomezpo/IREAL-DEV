import { ConfigService } from '@nestjs/config';
import { ApiHttpException } from '../common/envelope';
import { AiService } from './ai.service';
import { MetricsService } from '../metrics/metrics.service';
import { SupabaseService } from '../common/supabase/supabase.service';
import { CalendarCadence } from './dto/calendar.dto';

describe('AiService', () => {
  let service: AiService;
  const fetchMock = jest.spyOn(global, 'fetch');
  let runsTable: {
    insert: jest.Mock;
  };
  let publishTable: {
    insert: jest.Mock;
  };
  let entriesTable: {
    insert: jest.Mock;
    delete: jest.Mock;
    select: jest.Mock;
    order: jest.Mock;
    eq: jest.Mock;
  };
  let fromMock: jest.Mock;
  const configValues: Record<string, string> = {
    AI_API_KEY: 'test-key',
    AI_PROVIDER: 'test-provider',
  };
  const configMock = {
    get: jest.fn((key: string) => configValues[key]),
  } as unknown as ConfigService;

  const metricsMock = {
    observeAiLatency: jest.fn(),
    incrementAiTokens: jest.fn(),
    incrementAiErrors: jest.fn(),
  } as unknown as MetricsService;

  const supabaseMock: unknown = {
    getClient: jest.fn(),
  };

  beforeEach(() => {
    Object.assign(configValues, {
      AI_API_KEY: 'test-key',
      AI_PROVIDER: 'test-provider',
    });
    delete configValues.PUBLISH_SERVICE_ENABLED;
    delete configValues.TIKTOK_APP_ID;
    delete configValues.INSTAGRAM_APP_ID;
    jest.restoreAllMocks();
    runsTable = {
      insert: jest.fn().mockResolvedValue({}),
    };
    publishTable = {
      insert: jest.fn().mockResolvedValue({}),
    };
    entriesTable = {
      insert: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      order: jest.fn(),
      eq: jest.fn().mockReturnThis(),
    };
    fromMock = jest.fn((table: string) => {
      if (table === 'calendar_runs') {
        return runsTable;
      }
      if (table === 'calendar_entries') {
        return entriesTable;
      }
      if (table === 'publish_intents') {
        return publishTable;
      }
      return {
        insert: jest.fn().mockResolvedValue({}),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
    });
    (supabaseMock.getClient as jest.Mock).mockReturnValue({ from: fromMock });
    service = new AiService(
      configMock,
      metricsMock,
      supabaseMock as SupabaseService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns a success envelope when generate resolves', async () => {
    const callModelSpy: jest.SpyInstance<
      Promise<unknown>,
      unknown[]
    > = jest.spyOn(
      service as unknown as {
        callModel: (...args: unknown[]) => Promise<unknown>;
      },
      'callModel',
    );
    callModelSpy.mockResolvedValue({
      content: 'respuesta',
      tokens: 42,
      model: 'models/gemini-test',
      raw: {},
      latencyMs: 120,
    });

    const result = await service.generate({ prompt: 'hola', type: 'general' });

    expect(callModelSpy).toHaveBeenCalledWith(
      'generate',
      expect.any(String),
      expect.objectContaining({
        contents: expect.any(Array) as unknown,
      }),
    );

    expect(result.data).toMatchObject({
      type: 'general',
      content: 'respuesta',
      metadata: {
        tokens: 42,
        model: 'models/gemini-test',
        provider: 'test-provider',
        latencyMs: 120,
      },
    });
    expect(result.error).toBeNull();
    expect(result.meta).toMatchObject({
      provider: 'test-provider',
      model: 'models/gemini-test',
      tokens: 42,
      latencyMs: 120,
    });
  });

  it('throws ApiHttpException when provider responds with 500', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));

    await expect(
      service.generate({ prompt: 'hola', type: 'general' }),
    ).rejects.toBeInstanceOf(ApiHttpException);
  });

  it('enforces rate limiting', async () => {
    const limiter = (
      service as unknown as {
        getRateLimiter: (operation: string) => {
          consume: (key: string) => void;
        };
      }
    ).getRateLimiter('generate');

    const rateKey = 'generate:global';
    for (let i = 0; i < 30; i++) {
      limiter.consume(rateKey);
    }

    await expect(
      service.generate({ prompt: 'rate limit trigger' }),
    ).rejects.toBeInstanceOf(ApiHttpException);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('wraps timeout errors with AI_TIMEOUT code', async () => {
    fetchMock.mockImplementation(() => {
      throw new DOMException('Aborted', 'AbortError');
    });

    await expect(
      service.generate({ prompt: 'timeout test' }),
    ).rejects.toBeInstanceOf(ApiHttpException);
  });

  it('normalizes calendar requests with defaults', () => {
    const start = new Date('2025-11-01T00:00:00.000Z').toISOString();
    const end = new Date('2025-11-07T00:00:00.000Z').toISOString();

    const normalize = (
      service as unknown as {
        normalizeCalendarRequest: (dto: {
          channels: string[];
          cadence: CalendarCadence;
          start: string;
          end: string;
        }) => {
          channels: string[];
          cadence: CalendarCadence;
          calendarId: string;
        };
      }
    ).normalizeCalendarRequest({
      channels: ['instagram'],
      cadence: CalendarCadence.WEEKLY,
      start,
      end,
    });

    expect(normalize.channels).toEqual(['instagram']);
    expect(normalize.cadence).toBe(CalendarCadence.WEEKLY);
    expect(normalize.calendarId).toEqual(expect.any(String));
  });

  it('computes calendar diffs across runs', () => {
    const computeDiff = (
      service as unknown as {
        computeCalendarDiff: (
          previous: Array<{
            title: string;
            channel: string;
            date: string;
            time: string;
            format: string;
            copy: string;
            script: string;
            targetAudience: string;
            hashtags: string[];
          }>,
          nextPieces: Array<{
            title: string;
            channel: string;
            date: string;
            time: string;
            format: string;
            copy: string;
            script: string;
            targetAudience: string;
            hashtags: string[];
          }>,
        ) => {
          added: unknown[];
          updated: Array<{ before: unknown; after: unknown }>;
          removed: unknown[];
        };
      }
    ).computeCalendarDiff(
      [
        {
          title: 'Post 1',
          channel: 'instagram',
          date: '2025-11-01',
          time: '09:00',
          format: 'post',
          copy: 'hola',
          script: 'script',
          targetAudience: 'audiencia',
          hashtags: ['hola'],
        },
      ],
      [
        {
          title: 'Post 1',
          channel: 'instagram',
          date: '2025-11-01',
          time: '09:00',
          format: 'post',
          copy: 'hola mundo',
          script: 'script',
          targetAudience: 'audiencia',
          hashtags: ['hola'],
        },
        {
          title: 'Post 2',
          channel: 'tiktok',
          date: '2025-11-02',
          time: '09:00',
          format: 'video',
          copy: 'nuevo',
          script: 'script',
          targetAudience: 'audiencia',
          hashtags: ['nuevo'],
        },
      ],
    );

    expect(computeDiff.added).toHaveLength(1);
    expect(computeDiff.updated).toHaveLength(1);
    expect(computeDiff.removed).toHaveLength(0);
  });

  it('persists calendar edits and returns run id', async () => {
    const result = await service.saveCalendarEntries(
      {
        calendarId: 'cal-1',
        planId: 'plan-1',
        entries: [
          {
            title: 'Post 1',
            channel: 'instagram',
            format: 'post',
            copy: 'hola',
            script: 'script',
            targetAudience: 'audiencia',
            date: '2025-11-01',
            time: '09:00',
            hashtags: ['hola'],
          },
        ],
      },
      { userId: 'user-1' },
    );

    expect(runsTable.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        calendar_id: 'cal-1',
        user_id: 'user-1',
        status: 'completed',
        cadence: 'manual',
        piece_count: 1,
      }),
    );
    expect(entriesTable.delete).toHaveBeenCalled();
    /* eslint-disable @typescript-eslint/no-unsafe-assignment */
    expect(entriesTable.insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          calendar_id: 'cal-1',
          user_id: 'user-1',
          payload: expect.objectContaining({ title: 'Post 1' }),
        }),
      ]),
    );
    /* eslint-enable @typescript-eslint/no-unsafe-assignment */
    expect(result.data?.runId).toEqual(expect.any(String));
  });

  it('loads calendar entries for a user', async () => {
    entriesTable.order.mockResolvedValue({
      data: [
        {
          payload: {
            title: 'Post 1',
            channel: 'instagram',
            format: 'post',
            copy: 'hola',
            script: 'script',
            targetAudience: 'audiencia',
            date: '2025-11-01',
            time: '09:00',
            hashtags: ['hola'],
          },
        },
      ],
      error: null,
    });

    const result = await service.getCalendar('cal-1', { userId: 'user-1' });

    expect(entriesTable.select).toHaveBeenCalledWith('payload');
    expect(entriesTable.eq).toHaveBeenCalledWith('calendar_id', 'cal-1');
    expect(result.data?.entries).toHaveLength(1);
    expect(result.data?.entries[0]).toMatchObject({ title: 'Post 1' });
  });

  it('returns dry-run publish response when flag is off', async () => {
    delete configValues.PUBLISH_SERVICE_ENABLED;

    const result = await service.publish(
      { calendarId: 'cal-1' },
      { userId: 'user-1' },
    );

    expect(result.data).toMatchObject({
      status: 'disabled',
      reason: 'flag_off',
      calendarId: 'cal-1',
    });
    expect(publishTable.insert).not.toHaveBeenCalled();
  });

  it('publishes (dry-run) when flag is on with supported channels', async () => {
    configValues.PUBLISH_SERVICE_ENABLED = 'true';
    configValues.TIKTOK_APP_ID = 'tok';
    service = new AiService(
      configMock,
      metricsMock,
      supabaseMock as SupabaseService,
    );
    jest
      .spyOn(
        service as unknown as {
          fetchExistingEntries: () => Promise<
            Array<{
              title: string;
              channel: string;
              format: string;
              copy: string;
              script: string;
              targetAudience: string;
              date: string;
              time: string;
              hashtags: string[];
            }>
          >;
        },
        'fetchExistingEntries',
      )
      .mockResolvedValue([
        {
          title: 'Post',
          channel: 'tiktok',
          format: 'post',
          copy: '',
          script: '',
          targetAudience: '',
          date: '2025-11-01',
          time: '09:00',
          hashtags: [],
        },
      ]);

    const result = await service.publish(
      { calendarId: 'cal-1', runId: 'run-1' },
      { userId: 'user-1' },
    );

    expect(result.data).toMatchObject({
      status: 'dry_run',
      channels: ['tiktok'],
      entries: 1,
      calendarId: 'cal-1',
      runId: 'run-1',
    });
    expect(publishTable.insert).toHaveBeenCalled();
  });

  it('throws on unsupported channel', async () => {
    configValues.PUBLISH_SERVICE_ENABLED = 'true';
    configValues.TIKTOK_APP_ID = 'tok';
    service = new AiService(
      configMock,
      metricsMock,
      supabaseMock as SupabaseService,
    );
    jest
      .spyOn(
        service as unknown as {
          fetchExistingEntries: () => Promise<Array<{ channel: string }>>;
        },
        'fetchExistingEntries',
      )
      .mockResolvedValue([{ channel: 'youtube' }]);

    await expect(
      service.publish({ calendarId: 'cal-1' }, { userId: 'user-1' }),
    ).rejects.toBeInstanceOf(ApiHttpException);
  });

  it('throws when channel auth is missing', async () => {
    configValues.PUBLISH_SERVICE_ENABLED = 'true';
    delete configValues.TIKTOK_APP_ID;
    service = new AiService(
      configMock,
      metricsMock,
      supabaseMock as SupabaseService,
    );
    jest
      .spyOn(
        service as unknown as {
          fetchExistingEntries: () => Promise<Array<{ channel: string }>>;
        },
        'fetchExistingEntries',
      )
      .mockResolvedValue([{ channel: 'tiktok' }]);

    await expect(
      service.publish({ calendarId: 'cal-1' }, { userId: 'user-1' }),
    ).rejects.toBeInstanceOf(ApiHttpException);
  });

  it('returns disabled export when flag is off', async () => {
    delete configValues.PUBLISH_SERVICE_ENABLED;

    const result = await service.exportCalendar(
      { calendarId: 'cal-1', format: 'json' as never },
      { userId: 'user-1' },
    );

    expect(result.data).toMatchObject({
      status: 'disabled',
      calendarId: 'cal-1',
    });
  });

  it('returns export entries when flag is on (json)', async () => {
    configValues.PUBLISH_SERVICE_ENABLED = 'true';
    configValues.TIKTOK_APP_ID = 'tok';
    service = new AiService(
      configMock,
      metricsMock,
      supabaseMock as SupabaseService,
    );
    jest
      .spyOn(
        service as unknown as {
          fetchExistingEntries: () => Promise<
            Array<{
              title: string;
              channel: string;
              format: string;
              copy: string;
              script: string;
              targetAudience: string;
              date: string;
              time: string;
              hashtags: string[];
            }>
          >;
        },
        'fetchExistingEntries',
      )
      .mockResolvedValue([
        {
          title: 'Post',
          channel: 'tiktok',
          format: 'post',
          copy: '',
          script: '',
          targetAudience: '',
          date: '2025-11-01',
          time: '09:00',
          hashtags: [],
        },
      ]);

    const result = await service.exportCalendar(
      { calendarId: 'cal-1' },
      { userId: 'user-1' },
    );

    expect(result.data).toMatchObject({
      status: 'ok',
      calendarId: 'cal-1',
      format: 'json',
    });
    expect(result.data?.entries).toHaveLength(1);
  });

  it('returns csv when requested', async () => {
    configValues.PUBLISH_SERVICE_ENABLED = 'true';
    configValues.TIKTOK_APP_ID = 'tok';
    service = new AiService(
      configMock,
      metricsMock,
      supabaseMock as SupabaseService,
    );
    jest
      .spyOn(
        service as unknown as {
          fetchExistingEntries: () => Promise<
            Array<{
              title: string;
              channel: string;
              format: string;
              copy: string;
              script: string;
              targetAudience: string;
              date: string;
              time: string;
              hashtags: string[];
            }>
          >;
        },
        'fetchExistingEntries',
      )
      .mockResolvedValue([
        {
          title: 'Post',
          channel: 'tiktok',
          format: 'post',
          copy: '',
          script: '',
          targetAudience: '',
          date: '2025-11-01',
          time: '09:00',
          hashtags: ['tag'],
        },
      ]);

    const result = await service.exportCalendar(
      { calendarId: 'cal-1', format: 'csv' as never },
      { userId: 'user-1' },
    );

    expect(result.data).toMatchObject({
      status: 'ok',
      calendarId: 'cal-1',
      format: 'csv',
    });
    expect(result.data?.csv).toContain('title,channel');
    expect(result.data?.csv).toContain('Post');
  });
});
