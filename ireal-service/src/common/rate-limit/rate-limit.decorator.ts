import { SetMetadata } from '@nestjs/common';
import { RateLimitCategory } from './rate-limit.service';

export const RATE_LIMIT_CATEGORY_KEY = 'rate_limit_category';

export const RateLimit = (category: RateLimitCategory) =>
  SetMetadata(RATE_LIMIT_CATEGORY_KEY, category);
