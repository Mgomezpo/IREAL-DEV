import { ApiHttpException } from './envelope';
import { HttpStatus } from '@nestjs/common';

interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
  errorCode?: string;
  errorMessage?: string;
}

export class RateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(private readonly options: RateLimiterOptions) {}

  consume(key: string) {
    const now = Date.now();
    const windowStart = now - this.options.windowMs;

    const timestamps = this.hits.get(key) ?? [];
    const recent = timestamps.filter((timestamp) => timestamp > windowStart);

    if (recent.length >= this.options.maxRequests) {
      throw new ApiHttpException(
        this.options.errorCode ?? 'AI_RATE_LIMITED',
        this.options.errorMessage ??
          'Too many requests. Please wait before trying again.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    recent.push(now);
    this.hits.set(key, recent);
  }
}
