import { ConfigService } from '@nestjs/config';
import { ApiHttpException } from '../common/envelope';
import { AiService } from './ai.service';
import { MetricsService } from '../metrics/metrics.service';

describe('AiService', () => {
  let service: AiService;
  const fetchMock = jest.spyOn(global, 'fetch');

  const configMock = {
    get: jest.fn((key: string) => {
      if (key === 'AI_API_KEY') return 'test-key';
      if (key === 'AI_PROVIDER') return 'test-provider';
      return undefined;
    }),
  } as unknown as ConfigService;

  const metricsMock = {
    observeAiLatency: jest.fn(),
    incrementAiTokens: jest.fn(),
    incrementAiErrors: jest.fn(),
  } as unknown as MetricsService;

  beforeEach(() => {
    jest.restoreAllMocks();
    service = new AiService(configMock, metricsMock);
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
});
