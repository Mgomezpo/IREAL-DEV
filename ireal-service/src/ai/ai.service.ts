import { randomUUID } from 'node:crypto';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { MetricsService } from '../metrics/metrics.service';
import {
  ApiHttpException,
  ApiEnvelope,
  buildMeta,
  buildSuccess,
} from '../common/envelope';
import { RateLimiter } from '../common/rate-limiter';
import { GenerateAiDto } from './dto/generate-ai.dto';
import { PlanChatDto } from './dto/plan-chat.dto';
import { NudgeDto } from './dto/nudge.dto';
import { CalendarRequestDto } from './dto/calendar.dto';
import { PlanAssistDto } from './dto/plan-assist.dto';

interface AiCallResult {
  content: string;
  tokens: number;
  model: string;
  raw: unknown;
  latencyMs: number;
}

type Operation =
  | 'generate'
  | 'plan_chat'
  | 'nudge'
  | 'calendar'
  | 'plan_assist';

const GOOGLE_API_BASE =
  'https://generativelanguage.googleapis.com/v1beta/models';

const MODEL_DEFAULT = 'gemini-1.5-flash';
const MODEL_CALENDAR = 'gemini-pro';

const OPERATION_TIMEOUT: Record<Operation, number> = {
  generate: 15000,
  plan_chat: 12000,
  nudge: 8000,
  calendar: 20000,
  plan_assist: 15000,
};

const RATE_LIMITS: Record<Operation, { limit: number; windowMs: number }> = {
  generate: { limit: 30, windowMs: 60_000 },
  plan_chat: { limit: 20, windowMs: 60_000 },
  nudge: { limit: 5, windowMs: 20_000 },
  calendar: { limit: 10, windowMs: 300_000 },
  plan_assist: { limit: 20, windowMs: 60_000 },
};

interface AiMetadata {
  tokens: number;
  model: string;
  provider: string;
  latencyMs: number;
}

export interface AiGenerationData {
  id: string;
  type: string;
  content: string;
  metadata: AiMetadata;
  timestamp: string;
}

export interface AiPlanChatData {
  id: string;
  type: string;
  content: string;
  metadata: AiMetadata;
  timestamp: string;
}

export interface AiNudgeData {
  id: string;
  type: string;
  question: string;
  metadata: AiMetadata;
  timestamp: string;
}

export interface AiPlanAssistData {
  id: string;
  type: string;
  content: string;
  metadata: AiMetadata;
  timestamp: string;
}

export interface CalendarPiece {
  title: string;
  channel: string;
  format: string;
  copy: string;
  script: string;
  targetAudience: string;
  date: string;
  time: string;
  hashtags: string[];
}

export interface CalendarResponse {
  pieces: CalendarPiece[];
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiKey: string;
  private readonly provider: string;
  private readonly rateLimiters = new Map<string, RateLimiter>();

  constructor(
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
  ) {
    this.apiKey =
      this.configService.get<string>('AI_API_KEY') ??
      (() => {
        throw new Error('AI_API_KEY not configured');
      })();
    this.provider =
      this.configService.get<string>('AI_PROVIDER') ?? 'google-gemini';
  }

  private getRateLimiter(operation: Operation): RateLimiter {
    const existing = this.rateLimiters.get(operation);
    if (existing) {
      return existing;
    }

    const limiter = new RateLimiter({
      maxRequests: RATE_LIMITS[operation].limit,
      windowMs: RATE_LIMITS[operation].windowMs,
      errorCode: 'AI_RATE_LIMITED',
    });
    this.rateLimiters.set(operation, limiter);
    return limiter;
  }

  private async callModel(
    operation: Operation,
    endpoint: string,
    body: Record<string, unknown>,
    options?: { timeoutMs?: number; rateKey?: string },
  ): Promise<AiCallResult> {
    const timeoutMs = options?.timeoutMs ?? OPERATION_TIMEOUT[operation];
    try {
      this.getRateLimiter(operation).consume(
        `${operation}:${options?.rateKey ?? 'global'}`,
      );
    } catch (error) {
      this.metricsService.incrementAiErrors(operation, 'rate_limited');
      throw error;
    }

    const url = `${GOOGLE_API_BASE}/${endpoint}:generateContent?key=${this.apiKey}`;
    let attempts = 0;
    const maxAttempts = 2;
    const backoffBase = 300;

    while (attempts < maxAttempts) {
      const start = performance.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        const latencyMs = performance.now() - start;

        if (!response.ok) {
          this.metricsService.observeAiLatency(operation, 'error', latencyMs);
          if (response.status >= 500 && attempts + 1 < maxAttempts) {
            attempts++;
            const delay = backoffBase * attempts;
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }

          this.metricsService.incrementAiErrors(
            operation,
            `provider_${response.status}`,
          );
          throw new ApiHttpException(
            'AI_PROVIDER_ERROR',
            `AI provider responded with status ${response.status}`,
            HttpStatus.BAD_GATEWAY,
            { provider: this.provider },
          );
        }

        const payload = (await response.json()) as {
          candidates?: Array<{
            content?: { parts?: Array<{ text?: string }> };
          }>;
          usageMetadata?: { totalTokenCount?: number };
        };

        const text =
          payload.candidates?.[0]?.content?.parts?.[0]?.text ??
          (() => {
            throw new ApiHttpException(
              'AI_EMPTY_RESPONSE',
              'AI provider returned an empty response',
              HttpStatus.BAD_GATEWAY,
            );
          })();

        const tokens = payload.usageMetadata?.totalTokenCount ?? 0;
        this.metricsService.observeAiLatency(operation, 'success', latencyMs);
        this.metricsService.incrementAiTokens(operation, endpoint, tokens);

        return {
          content: text,
          tokens,
          model: endpoint,
          raw: payload,
          latencyMs,
        };
      } catch (error) {
        clearTimeout(timeout);

        if (error instanceof ApiHttpException) {
          throw error;
        }

        if (
          error instanceof DOMException ||
          (error as { name?: string }).name === 'AbortError'
        ) {
          this.metricsService.incrementAiErrors(operation, 'timeout');
          if (attempts + 1 < maxAttempts) {
            attempts++;
            const delay = backoffBase * (attempts + 1);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }

          throw new ApiHttpException(
            'AI_TIMEOUT',
            'AI provider timeout',
            HttpStatus.GATEWAY_TIMEOUT,
          );
        }

        this.metricsService.incrementAiErrors(operation, 'unknown');
        this.logger.error(
          `AI call failed for ${operation}`,
          (error as Error).stack,
        );
        throw new ApiHttpException(
          'AI_CALL_FAILED',
          'AI provider call failed',
          HttpStatus.BAD_GATEWAY,
        );
      } finally {
        attempts++;
      }
    }

    throw new ApiHttpException(
      'AI_CALL_FAILED',
      'AI provider call failed after retries',
      HttpStatus.BAD_GATEWAY,
    );
  }

  async generate(dto: GenerateAiDto): Promise<ApiEnvelope<AiGenerationData>> {
    const systemPrompt = this.buildSystemPrompt(dto.type ?? 'general');

    const result = await this.callModel('generate', MODEL_DEFAULT, {
      contents: [
        {
          parts: [{ text: systemPrompt }, { text: dto.prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: dto.type === 'calendar' ? 2048 : 1024,
      },
    });

    return buildSuccess(
      {
        id: randomUUID(),
        type: dto.type ?? 'general',
        content: result.content,
        metadata: {
          tokens: result.tokens,
          model: result.model,
          provider: this.provider,
          latencyMs: result.latencyMs,
        },
        timestamp: new Date().toISOString(),
      },
      {
        provider: this.provider,
        model: result.model,
        tokens: result.tokens,
        latencyMs: result.latencyMs,
      },
    );
  }

  async planChat(dto: PlanChatDto): Promise<ApiEnvelope<AiPlanChatData>> {
    const history = dto.messages
      .slice(0, -1)
      .map((message) => message.content)
      .join('\n');

    const lastMessage = dto.messages[dto.messages.length - 1]?.content ?? '';

    const contextualPrompt = dto.planContext
      ? `${this.planSystemPrompt()}

Contexto del plan:
- Nombre: ${dto.planContext.name}
- Objetivo: ${dto.planContext.description ?? 'No especificado'}
- Canales: ${dto.planContext.channels?.join(', ') ?? 'No especificados'}
`
      : this.planSystemPrompt();

    const result = await this.callModel('plan_chat', MODEL_DEFAULT, {
      contents: [
        {
          parts: [{ text: contextualPrompt }],
        },
        {
          parts: [{ text: history }],
        },
        {
          parts: [{ text: lastMessage }],
        },
      ],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 150,
      },
    });

    return buildSuccess(
      {
        id: randomUUID(),
        type: 'plan_chat',
        content: result.content.trim(),
        metadata: {
          tokens: result.tokens,
          model: result.model,
          provider: this.provider,
          latencyMs: result.latencyMs,
        },
        timestamp: new Date().toISOString(),
      },
      {
        provider: this.provider,
        model: result.model,
        tokens: result.tokens,
        latencyMs: result.latencyMs,
      },
    );
  }

  async nudge(dto: NudgeDto): Promise<ApiEnvelope<AiNudgeData>> {
    const prompt = `${this.nudgeSystemPrompt()}

Fragmento del creador:
"${dto.fragment}"`;

    const result = await this.callModel(
      'nudge',
      MODEL_DEFAULT,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 60,
        },
      },
      { rateKey: dto.userId ?? 'anonymous' },
    );

    return buildSuccess(
      {
        id: randomUUID(),
        type: 'nudge',
        question: result.content.trim(),
        metadata: {
          tokens: result.tokens,
          model: result.model,
          provider: this.provider,
          latencyMs: result.latencyMs,
        },
        timestamp: new Date().toISOString(),
      },
      {
        provider: this.provider,
        model: result.model,
        tokens: result.tokens,
        latencyMs: result.latencyMs,
      },
    );
  }

  async planAssist(dto: PlanAssistDto): Promise<ApiEnvelope<AiPlanAssistData>> {
    const context = dto.context ?? '';
    const command = dto.command ?? '';
    const lastMessage = dto.messages.at(-1)?.content ?? '';

    const systemPrompt = `${this.planAssistPrompt()}

Plan context: ${context}
Requested command: ${command}`;

    const result = await this.callModel('plan_assist', MODEL_DEFAULT, {
      contents: [
        {
          parts: [{ text: systemPrompt }],
        },
        {
          parts: [{ text: lastMessage }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    return buildSuccess(
      {
        id: randomUUID(),
        type: 'plan_assist',
        content: result.content,
        metadata: {
          tokens: result.tokens,
          model: result.model,
          provider: this.provider,
          latencyMs: result.latencyMs,
        },
        timestamp: new Date().toISOString(),
      },
      {
        provider: this.provider,
        model: result.model,
        tokens: result.tokens,
        latencyMs: result.latencyMs,
      },
    );
  }

  async streamCalendar(dto: CalendarRequestDto, res: Response): Promise<void> {
    this.getRateLimiter('calendar').consume(
      `calendar:${dto.planId ?? 'global'}`,
    );

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      const prompt = this.buildCalendarPrompt(dto);
      const result = await this.callModel(
        'calendar',
        MODEL_CALENDAR,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        },
        { timeoutMs: OPERATION_TIMEOUT.calendar },
      );

      const calendar = this.parseCalendar(result.content, dto);
      const envelope = {
        data: calendar,
        error: null,
        meta: buildMeta({
          provider: this.provider,
          model: result.model,
          tokens: result.tokens,
          latencyMs: result.latencyMs,
        }),
      };

      res.write(`event: data\n`);
      res.write(`data: ${JSON.stringify(envelope)}\n\n`);
      res.write(`event: done\ndata: {}\n\n`);
      res.end();
    } catch (error) {
      const apiError =
        error instanceof ApiHttpException
          ? (
              error.getResponse() as {
                error?: { code?: string; message?: string };
              }
            ).error
          : undefined;

      const envelope = {
        data: null,
        error: {
          code: apiError?.code ?? 'AI_ERROR',
          message: apiError?.message ?? 'Failed to generate calendar',
        },
        meta: buildMeta({ provider: this.provider }),
      };

      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify(envelope)}\n\n`);
      res.end();
    }
  }

  private buildSystemPrompt(type: 'general' | 'calendar' | 'idea' | 'plan') {
    switch (type) {
      case 'calendar':
        return 'Generate a strategic content calendar in Spanish that includes dates, channels, and captions.';
      case 'idea':
        return 'Act as a creative ideation partner in Spanish. Provide unique, actionable concepts.';
      case 'plan':
        return 'You are a content strategist. Design detailed publishing plans with key talking points.';
      default:
        return 'You are a creative assistant for content creators. Reply in Spanish with helpful, imaginative guidance.';
    }
  }

  private planSystemPrompt() {
    return [
      'You are a creative content strategist inspired by the approach of Rick Rubin.',
      'Ask deep yet concise questions (15-40 words) that clarify the plan vision.',
      'Respond in Spanish with a warm tone and avoid heavy markdown.',
    ].join(' ');
  }

  private nudgeSystemPrompt() {
    return [
      'You are a creative guide inspired by Rick Rubin.',
      'Ask exactly one concise (8-25 words), poetic, thought-provoking question that invites depth.',
      'Always finish with a question mark and write in Spanish.',
    ].join(' ');
  }

  private planAssistPrompt() {
    return [
      'You are a content planning assistant for the IREAL platform.',
      'Help create and refine strategic plans with concrete actions.',
    ].join(' ');
  }

  private buildCalendarPrompt(dto: CalendarRequestDto) {
    return [
      'Generate a content calendar using the following details:',
      `- Start date: ${dto.startDate}`,
      `- End date: ${dto.endDate}`,
      `- Weekly frequency: ${dto.frequency}`,
      `- Channels: ${dto.channels.join(', ')}`,
      `- Accounts: ${dto.accounts.join(', ')}`,
      `- Pillars: ${dto.pillars ?? 'Not specified'}`,
      `- Objectives: ${dto.objectives ?? 'Not specified'}`,
      `- Linked ideas: ${dto.ideas ?? 'Not specified'}`,
      'Return JSON formatted as { "pieces": [ { "title", "channel", "format", "copy", "script", "targetAudience", "date", "time", "hashtags" } ] }.',
      'Write the copy in Spanish.',
    ].join('\n');
  }

  private parseCalendar(
    content: string,
    request: CalendarRequestDto,
  ): CalendarResponse {
    try {
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) {
        throw new Error('No JSON found');
      }

      const parsed = JSON.parse(match[0]) as CalendarResponse;
      if (!Array.isArray(parsed.pieces)) {
        throw new Error('Invalid pieces array');
      }

      return parsed;
    } catch (error) {
      this.logger.warn(
        `Failed to parse calendar response for plan ${request.planId}: ${
          (error as Error).message
        }`,
      );
      return {
        pieces: [
          {
            title: 'AI generated content',
            channel: request.channels[0] ?? 'IG',
            format: 'post',
            copy: 'AI generated content. Adjust details for your audience.',
            script: 'Introduction\nDevelopment\nFinal CTA',
            targetAudience: 'Marketing professionals',
            date: request.startDate,
            time: '09:00',
            hashtags: ['marketing', 'content', 'ai'],
          },
        ],
      };
    }
  }
}
