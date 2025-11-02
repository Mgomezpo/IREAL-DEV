import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiHttpException } from '../envelope';

export type RateLimitCategory = 'ai' | 'write';

interface RateLimitThresholds {
  perUser: number;
  perIp: number;
}

interface RateLimitConfig {
  windowMs: number;
  ai: RateLimitThresholds;
  write: RateLimitThresholds;
}

type BucketKey =
  | `user:${RateLimitCategory}:${string}`
  | `ip:${RateLimitCategory}:${string}`;

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly hits = new Map<BucketKey, number[]>();
  private readonly config: RateLimitConfig;

  constructor(private readonly configService: ConfigService) {
    const windowMs =
      this.configService.get<number>('RATE_LIMIT_WINDOW_SECONDS', 60) * 1000;
    this.config = {
      windowMs,
      ai: {
        perUser: this.configService.get<number>('AI_RATE_LIMIT_PER_USER', 5),
        perIp: this.configService.get<number>('AI_RATE_LIMIT_PER_IP', 30),
      },
      write: {
        perUser: this.configService.get<number>(
          'WRITE_RATE_LIMIT_PER_USER',
          60,
        ),
        perIp: this.configService.get<number>('WRITE_RATE_LIMIT_PER_IP', 120),
      },
    };
  }

  get windowMs(): number {
    return this.config.windowMs;
  }

  consume(category: RateLimitCategory, userId: string, ip: string): void {
    const safeUser = userId?.trim().toLowerCase() || 'anonymous';
    const safeIp = ip?.trim() || 'unknown';
    const thresholds = this.thresholdsFor(category);

    this.checkLimit(
      `user:${category}:${safeUser}`,
      thresholds.perUser,
      'user',
      safeUser,
      category,
    );
    this.checkLimit(
      `ip:${category}:${safeIp}`,
      thresholds.perIp,
      'ip',
      safeIp,
      category,
    );
  }

  private thresholdsFor(category: RateLimitCategory): RateLimitThresholds {
    return this.config[category];
  }

  private checkLimit(
    key: BucketKey,
    limit: number,
    dimension: 'user' | 'ip',
    identifier: string,
    category: RateLimitCategory,
  ): void {
    if (limit <= 0) {
      return;
    }

    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const timestamps = this.hits.get(key) ?? [];
    const recent = timestamps.filter((timestamp) => timestamp > windowStart);

    if (recent.length >= limit) {
      this.logger.warn(
        `Rate limit exceeded for ${dimension} "${identifier}" in ${category}`,
      );
      throw new ApiHttpException(
        dimension === 'user' ? 'RATE_LIMIT_USER' : 'RATE_LIMIT_IP',
        'Too many requests. Please wait before trying again.',
        HttpStatus.TOO_MANY_REQUESTS,
        {
          dimension,
          identifier,
          category,
          limit,
          windowMs: this.config.windowMs,
        },
      );
    }

    recent.push(now);
    this.hits.set(key, recent);
  }
}
