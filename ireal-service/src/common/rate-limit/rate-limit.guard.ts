import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { RateLimitCategory, RateLimitService } from './rate-limit.service';
import { RATE_LIMIT_CATEGORY_KEY } from './rate-limit.decorator';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly rateLimitService: RateLimitService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const category = this.reflector.get<RateLimitCategory>(
      RATE_LIMIT_CATEGORY_KEY,
      context.getHandler(),
    );

    if (!category) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const userId =
      this.headerValue(request, 'x-user-id')?.trim() ??
      (request as { user?: { id?: string } }).user?.id ??
      'anonymous';
    const ip = this.getClientIp(request);

    this.rateLimitService.consume(category, userId, ip);
    return true;
  }

  private headerValue(request: Request, name: string): string | undefined {
    const value = request.headers[name];
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }

  private getClientIp(request: Request): string {
    const forwarded = this.headerValue(request, 'x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0]?.trim() ?? request.ip ?? 'unknown';
    }
    return request.ip ?? request.socket?.remoteAddress ?? 'unknown';
  }
}
