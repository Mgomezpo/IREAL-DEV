import { CanActivate, HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { ApiHttpException } from '../common/envelope';
import { ApiExceptionFilter } from '../common/filters/api-exception.filter';
import { createValidationPipe } from '../common/pipes/api-validation.pipe';
import { RateLimitGuard } from '../common/rate-limit/rate-limit.guard';
import { RateLimitService } from '../common/rate-limit/rate-limit.service';

const aiServiceMock = {
  generate: jest.fn(),
  planChat: jest.fn(),
  nudge: jest.fn(),
  planAssist: jest.fn(),
  streamCalendar: jest.fn(),
};

describe('AiController rate limit behaviour', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        { provide: AiService, useValue: aiServiceMock },
        { provide: RateLimitService, useValue: { consume: jest.fn() } },
        Reflector,
        { provide: RateLimitGuard, useValue: { canActivate: () => true } },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    app.useGlobalPipes(createValidationPipe());

    const throttlingGuard: CanActivate = {
      canActivate: () => {
        throw new ApiHttpException(
          'RATE_LIMIT_USER',
          'Too many requests. Please wait before trying again.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      },
    };
    app.useGlobalGuards(throttlingGuard);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns envelope when throttled', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    await request(server)
      .post('/v1/ai/generate')
      .send({ prompt: 'hola' })
      .expect(HttpStatus.TOO_MANY_REQUESTS)
      .expect(({ body }: { body: Record<string, unknown> }) => {
        expect(body).toMatchObject({
          data: null,
          error: {
            code: 'RATE_LIMIT_USER',
            message: 'Too many requests. Please wait before trying again.',
          },
        });
        expect(body).toHaveProperty('meta');
      });
  });
});
