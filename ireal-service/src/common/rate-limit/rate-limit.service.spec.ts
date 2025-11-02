import { ConfigService } from '@nestjs/config';
import { HttpStatus } from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';
import { ApiHttpException } from '../envelope';

const mockConfig = (overrides: Partial<Record<string, number>> = {}) =>
  ({
    get: jest.fn(
      (key: string, defaultValue?: number) => overrides[key] ?? defaultValue,
    ),
  }) as unknown as ConfigService;

describe('RateLimitService', () => {
  describe('consume', () => {
    it('allows requests under the limit', () => {
      const service = new RateLimitService(
        mockConfig({
          RATE_LIMIT_WINDOW_SECONDS: 60,
          AI_RATE_LIMIT_PER_USER: 2,
          AI_RATE_LIMIT_PER_IP: 2,
        }),
      );

      expect(() => service.consume('ai', 'user-1', '127.0.0.1')).not.toThrow();
      expect(() => service.consume('ai', 'user-1', '127.0.0.1')).not.toThrow();
    });

    it('throws ApiHttpException when user limit exceeded', () => {
      const service = new RateLimitService(
        mockConfig({
          RATE_LIMIT_WINDOW_SECONDS: 60,
          AI_RATE_LIMIT_PER_USER: 1,
          AI_RATE_LIMIT_PER_IP: 10,
        }),
      );

      service.consume('ai', 'user-1', '127.0.0.1');

      expect.assertions(3);
      try {
        service.consume('ai', 'user-1', '127.0.0.1');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiHttpException);
        const apiError = error as ApiHttpException;
        expect(apiError.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
        const response = apiError.getResponse() as {
          error: { code: string };
        };
        expect(response.error.code).toBe('RATE_LIMIT_USER');
        return;
      }
      throw new Error('Expected rate limit error for user');
    });

    it('throws ApiHttpException when ip limit exceeded', () => {
      const service = new RateLimitService(
        mockConfig({
          RATE_LIMIT_WINDOW_SECONDS: 60,
          AI_RATE_LIMIT_PER_USER: 10,
          AI_RATE_LIMIT_PER_IP: 1,
        }),
      );

      service.consume('ai', 'user-1', '127.0.0.1');

      expect.assertions(3);
      try {
        service.consume('ai', 'user-2', '127.0.0.1');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiHttpException);
        const apiError = error as ApiHttpException;
        expect(apiError.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
        const response = apiError.getResponse() as {
          error: { code: string };
        };
        expect(response.error.code).toBe('RATE_LIMIT_IP');
        return;
      }
      throw new Error('Expected rate limit error for ip');
    });
  });
});
