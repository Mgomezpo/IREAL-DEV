import { randomUUID } from 'node:crypto';

import { HttpStatus, Injectable, Logger } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { GoogleGenAI } from '@google/genai';

import { Response } from 'express';

import { z } from 'zod';

import { MetricsService } from '../metrics/metrics.service';

import { SupabaseService } from '../common/supabase/supabase.service';

import {
  ApiHttpException,
  ApiMeta,
  ApiEnvelope,
  buildMeta,
  buildSuccess,
} from '../common/envelope';

import { RateLimiter } from '../common/rate-limiter';

import { GenerateAiDto } from './dto/generate-ai.dto';
import { PlanChatDto } from './dto/plan-chat.dto';
import { NudgeDto } from './dto/nudge.dto';
import {
  CalendarCadence,
  CalendarRequestDto,
  SaveCalendarEntriesDto,
} from './dto/calendar.dto';
import { PlanAssistDto } from './dto/plan-assist.dto';
import { PublishRequestDto } from './dto/publish.dto';
import { ExportCalendarDto, ExportFormat } from './dto/export-calendar.dto';
import { GeneratePlanFormDto } from './dto/generate-plan-form.dto';

const SUPPORTED_CHANNELS = ['tiktok', 'instagram'] as const;

type SupportedChannel = (typeof SUPPORTED_CHANNELS)[number];

interface AiCallResult {
  content: string;

  tokens: number;

  model: string;

  raw: unknown;

  latencyMs: number;
}

type Operation =
  | 'generate'
  | 'generate_plan'
  | 'plan_chat'
  | 'nudge'
  | 'calendar'
  | 'plan_assist'
  | 'publish';

const GOOGLE_API_BASE =
  'https://generativelanguage.googleapis.com/v1beta/models';

const MODEL_DEFAULT = 'gemini-1.5-flash';

const MODEL_CALENDAR = 'gemini-pro';

const PLAN_MODEL = 'gemini-2.5-flash';

const OPERATION_TIMEOUT: Record<Operation, number> = {
  generate: 15000,

  generate_plan: 20000,

  plan_chat: 12000,

  nudge: 8000,

  calendar: 30000,

  plan_assist: 15000,

  publish: 15000,
};

const RATE_LIMITS: Record<Operation, { limit: number; windowMs: number }> = {
  generate: { limit: 30, windowMs: 60_000 },

  generate_plan: { limit: 12, windowMs: 60_000 },

  plan_chat: { limit: 20, windowMs: 60_000 },

  nudge: { limit: 5, windowMs: 20_000 },

  calendar: { limit: 10, windowMs: 300_000 },

  plan_assist: { limit: 20, windowMs: 60_000 },

  publish: { limit: 10, windowMs: 60_000 },
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
  id?: string;

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

interface NormalizedCalendarRequest {
  channels: string[];

  cadence: CalendarCadence;

  start: string;

  end: string;

  constraints: Record<string, unknown> | null;

  calendarId: string;

  planId?: string;

  timezone?: string;

  objectives?: string;

  ideas?: string;

  pillars?: string;
}

const normalizeStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === 'string' ? item.trim() : String(item ?? '').trim(),
      )
      .filter((item) => item.length > 0);
  }

  if (typeof value === 'string') {
    return value
      .split(/[\n,;]+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  return [];
};

const stringArraySchema = z.preprocess(
  (value) => normalizeStringArray(value),
  z.array(z.string()).min(1),
);

const tripleStringArraySchema = z.preprocess(
  (value) => normalizeStringArray(value),
  z.array(z.string()).min(3),
);

const planIdeaSchema = z.object({
  numero: z.preprocess((value) => {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number.parseInt(value, 10);
      return Number.isFinite(parsed) ? parsed : value;
    }

    return value;
  }, z.number().int().positive()),

  tema: z.string(),

  hook: z.string(),

  desarrollo: z.string(),

  punto_quiebre: z.string(),

  cta: z.string(),

  copy: z.string(),

  pilar: z.string(),
});

const planSchema = z.object({
  ruta_seleccionada: z.string().min(3),

  explicacion_ruta: z.string().min(3),

  metadata: z.object({
    nombre: z.string().min(1),

    fecha: z.string().min(4),
  }),

  perfil_audiencia: z.object({
    descripcion_general: z.string().min(3),

    demografia: z.string().min(3),

    psicografia: z.string().min(3),

    pain_points: tripleStringArraySchema,

    aspiraciones: tripleStringArraySchema,

    lenguaje_recomendado: z.string().min(3),
  }),

  fundamentos: z.object({
    pilares_contenido: z
      .array(
        z.object({
          nombre: z.string(),

          descripcion: z.string(),

          proposito: z.string(),
        }),
      )
      .min(3),

    tono_voz: z.string().min(3),

    propuesta_valor: z.string().min(3),
  }),

  ideas_contenido: z.array(planIdeaSchema).min(4),

  recomendaciones: z.object({
    frecuencia_publicacion: z.string().min(3),

    mejores_horarios: z.string().min(3),

    hashtags_sugeridos: stringArraySchema,

    formatos_prioritarios: stringArraySchema,

    metricas_clave: stringArraySchema,

    consejos_magicos: stringArraySchema,
  }),
});

type StructuredPlan = z.infer<typeof planSchema>;

export type PlanGenerationDocument = StructuredPlan & {
  plan_text: string;

  plan: string;
};

type GeminiGenerateResponse = {
  text?: string | (() => string);

  response?: {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;

    usageMetadata?: { totalTokenCount?: number };
  };

  usageMetadata?: { totalTokenCount?: number };
};

interface CalendarDiff extends Record<string, unknown> {
  added: CalendarPiece[];

  updated: Array<{ before: CalendarPiece; after: CalendarPiece }>;

  removed: CalendarPiece[];
}

interface CalendarStreamSummary {
  calendarId: string;

  runId: string;

  diff: CalendarDiff;

  pieceCount: number;

  status: 'completed' | 'timeout' | 'failed';
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  private readonly apiKey: string;

  private readonly provider: string;

  private readonly geminiClient: GoogleGenAI;

  private readonly rateLimiters = new Map<string, RateLimiter>();

  private readonly calendarLocks = new Set<string>();

  private readonly publishEnabled: boolean;

  private logAudit(event: string, payload: Record<string, unknown>): void {
    this.logger.log({ event, ...payload });
  }

  constructor(
    private readonly configService: ConfigService,

    private readonly metricsService: MetricsService,

    private readonly supabase: SupabaseService,
  ) {
    this.apiKey =
      this.configService.get<string>('GEMINI_API_KEY') ??
      this.configService.get<string>('AI_API_KEY') ??
      process.env.GEMINI_API_KEY ??
      process.env.AI_API_KEY ??
      (() => {
        throw new Error('AI_API_KEY or GEMINI_API_KEY not configured');
      })();

    this.geminiClient = new GoogleGenAI({ apiKey: this.apiKey });

    this.provider =
      this.configService.get<string>('AI_PROVIDER') ?? 'google-gemini';

    this.publishEnabled =
      this.configService.get<string>('PUBLISH_SERVICE_ENABLED') === 'true';
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

  async generatePlanFromForm(
    dto: GeneratePlanFormDto,
  ): Promise<ApiEnvelope<PlanGenerationDocument>> {
    const prompt = this.buildPlanPromptFromForm(dto);

    const start = performance.now();

    try {
      const response = await this.geminiClient.models.generateContent({
        model: PLAN_MODEL,

        contents: prompt,

        generationConfig: {
          temperature: 0.6,

          topK: 40,

          topP: 0.9,

          maxOutputTokens: 4096,

          responseMimeType: 'application/json',
        },
      });

      const aiResponse = response as GeminiGenerateResponse;

      const latencyMs = performance.now() - start;

      let rawText: string | undefined;

      if (typeof aiResponse.text === 'function') {
        rawText = aiResponse.text();
      } else if (typeof aiResponse.text === 'string') {
        rawText = aiResponse.text;
      } else {
        rawText = (aiResponse.response?.candidates?.[0]?.content?.parts ?? [])
          .map((part: { text?: string }) => part.text ?? '')
          .join('');
      }

      if (!rawText) {
        throw new ApiHttpException(
          'AI_EMPTY_RESPONSE',

          'AI provider returned an empty response',

          HttpStatus.BAD_GATEWAY,
        );
      }

      const tokens =
        aiResponse.response?.usageMetadata?.totalTokenCount ??
        aiResponse.usageMetadata?.totalTokenCount ??
        0;

      const jsonPayload = this.extractJsonObject(rawText);

      const structuredPlan = this.parsePlanJson(jsonPayload, dto);

      const planText = this.renderPlanTemplate(structuredPlan);

      this.metricsService.observeAiLatency(
        'generate_plan',

        'success',

        latencyMs,
      );

      if (tokens > 0) {
        this.metricsService.incrementAiTokens(
          'generate_plan',

          PLAN_MODEL,

          tokens,
        );
      }

      const document: PlanGenerationDocument = {
        ...structuredPlan,

        plan_text: planText,

        plan: planText,
      };

      return buildSuccess(document, {
        provider: this.provider,

        model: PLAN_MODEL,

        tokens,

        latencyMs,
      });
    } catch (error: unknown) {
      const latencyMs = performance.now() - start;

      this.metricsService.observeAiLatency('generate_plan', 'error', latencyMs);

      this.metricsService.incrementAiErrors(
        'generate_plan',

        this.extractErrorCode(error as ApiHttpException) ?? 'unexpected',
      );

      this.logger.error(
        'Gemini plan generation failed',

        error instanceof Error ? error.stack : String(error),
      );

      if (error instanceof ApiHttpException) {
        throw error;
      }

      const message =
        error instanceof Error ? error.message : 'AI provider error';

      throw new ApiHttpException(
        'AI_PLAN_GENERATION_FAILED',

        message,

        HttpStatus.BAD_GATEWAY,
      );
    }
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

  async publish(
    dto: PublishRequestDto,
    context: { userId?: string; requestId?: string } = {},
  ): Promise<
    ApiEnvelope<{
      intentId: string;

      calendarId: string;

      runId: string | null;

      channels: string[];

      entries: number;

      status: string;

      reason?: string;
    }>
  > {
    const userId = context.userId ?? 'anonymous';

    const runId = dto.runId ?? null;

    if (!this.publishEnabled) {
      const intentId = randomUUID();

      this.logAudit('publish', {
        status: 'disabled',
        reason: 'flag_off',
        calendarId: dto.calendarId,
        runId,
        userId,
        requestId: context.requestId,
        channels: [],
        entryCount: 0,
        intentId,
      });

      return buildSuccess(
        {
          intentId,

          calendarId: dto.calendarId,

          runId,

          channels: [],

          entries: 0,

          status: 'disabled',

          reason: 'flag_off',
        },

        { provider: 'legacy-publish-disabled' },
      );
    }

    this.getRateLimiter('publish').consume(`publish:${userId}`);

    const entries = await this.fetchExistingEntries(dto.calendarId, userId);

    const channels = this.collectChannels(entries);

    if (channels.size === 0 && entries.length > 0) {
      throw new ApiHttpException(
        'CHANNEL_UNSUPPORTED',

        'One or more entries are missing a supported channel.',

        HttpStatus.BAD_REQUEST,
      );
    }

    this.ensureChannelAuth(channels);

    const intentId = await this.persistPublishIntent({
      calendarId: dto.calendarId,

      runId,

      userId,

      channels: Array.from(channels),

      entries,

      status: 'dry_run',
    });

    const channelsArray = Array.from(channels);

    this.logAudit('publish', {
      status: 'dry_run',
      calendarId: dto.calendarId,
      runId,
      userId,
      requestId: context.requestId,
      channels: channelsArray,
      entryCount: entries.length,
      intentId,
    });

    return buildSuccess(
      {
        intentId,

        calendarId: dto.calendarId,

        runId,

        channels: channelsArray,

        entries: entries.length,

        status: 'dry_run',
      },
      { provider: this.provider },
    );
  }

  async exportCalendar(
    dto: ExportCalendarDto,
    context: { userId?: string; requestId?: string } = {},
  ): Promise<
    ApiEnvelope<{
      calendarId: string;
      runId: string | null;
      format: string;
      status: string;
      entries?: Array<CalendarPiece & { status: string }>;
      csv?: string;
    }>
  > {
    const userId = context.userId ?? 'anonymous';
    const format = dto.format ?? ExportFormat.JSON;
    const runId = dto.runId ?? null;

    if (!this.publishEnabled) {
      this.logAudit('export_calendar', {
        status: 'disabled',
        reason: 'flag_off',
        calendarId: dto.calendarId,
        runId,
        userId,
        requestId: context.requestId,
        format,
        entryCount: 0,
      });

      return buildSuccess(
        {
          calendarId: dto.calendarId,
          runId,
          format,
          status: 'disabled',
        },
        { provider: 'legacy-publish-disabled' },
      );
    }

    const entries = await this.fetchExistingEntries(dto.calendarId, userId);
    const exportEntries = entries.map((piece) => ({
      ...piece,
      status: 'pending',
    }));

    if (format === ExportFormat.CSV) {
      const csv = this.buildCsv(exportEntries);

      this.logAudit('export_calendar', {
        status: 'ok',
        calendarId: dto.calendarId,
        runId,
        userId,
        requestId: context.requestId,
        format: ExportFormat.CSV,
        entryCount: exportEntries.length,
      });

      return buildSuccess(
        {
          calendarId: dto.calendarId,
          runId,
          format,
          status: 'ok',
          csv,
        },
        { provider: this.provider },
      );
    }

    this.logAudit('export_calendar', {
      status: 'ok',
      calendarId: dto.calendarId,
      runId,
      userId,
      requestId: context.requestId,
      format,
      entryCount: exportEntries.length,
    });

    return buildSuccess(
      {
        calendarId: dto.calendarId,
        runId,
        format,
        status: 'ok',
        entries: exportEntries,
      },
      { provider: this.provider },
    );
  }

  async streamCalendar(
    dto: CalendarRequestDto,
    res: Response,
    context: { userId?: string; requestId?: string } = {},
  ): Promise<void> {
    const userId = context.userId ?? 'anonymous';

    const normalized = this.normalizeCalendarRequest(dto);

    const lockKey = userId;

    if (!this.acquireCalendarLock(lockKey)) {
      this.logAudit('calendar_stream', {
        status: 'in_progress',
        calendarId: normalized.calendarId,
        userId,
        requestId: context.requestId,
        runId: null,
        channels: normalized.channels,
        cadence: normalized.cadence,
      });

      const envelope = {
        data: null,

        error: {
          code: 'CALENDAR_IN_PROGRESS',

          message:
            'A calendar generation is already running for this account. Please wait for it to finish.',
        },

        meta: buildMeta({ provider: this.provider }),
      };

      res.statusCode = HttpStatus.TOO_MANY_REQUESTS;

      res.setHeader('Content-Type', 'text/event-stream');

      res.write(`event: error\n`);

      res.write(`data: ${JSON.stringify(envelope)}\n\n`);

      res.end();

      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');

    res.setHeader('Cache-Control', 'no-cache, no-transform');

    res.setHeader('Connection', 'keep-alive');

    res.flushHeaders?.();

    const heartbeat = setInterval(() => {
      if (res.writableEnded) {
        clearInterval(heartbeat);

        return;
      }

      res.write(`: keep-alive\n\n`);
    }, 10_000);

    let status: 'completed' | 'timeout' | 'failed' = 'completed';

    let diff: CalendarDiff = { added: [], updated: [], removed: [] };

    let pieces: CalendarPiece[] = [];

    let tokens = 0;

    let model = MODEL_CALENDAR;

    let latencyMs = 0;

    const runId = randomUUID();
    const requestId = context.requestId;

    this.logAudit('calendar_stream', {
      status: 'started',
      calendarId: normalized.calendarId,
      runId,
      userId,
      requestId,
      channels: normalized.channels,
      cadence: normalized.cadence,
      start: normalized.start,
      end: normalized.end,
    });

    try {
      this.getRateLimiter('calendar').consume(`calendar:${lockKey}`);

      const previousEntries = await this.fetchExistingEntries(
        normalized.calendarId,

        userId,
      );

      const prompt = this.buildCalendarPrompt(normalized);

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

        { timeoutMs: 30_000, rateKey: lockKey },
      );

      tokens = result.tokens;

      model = result.model;

      latencyMs = result.latencyMs;

      pieces = this.enrichCalendarPieces(
        this.parseCalendar(result.content, normalized),
      );

      diff = this.computeCalendarDiff(previousEntries, pieces);

      await this.persistCalendarRun({
        runId,

        calendarId: normalized.calendarId,

        userId,

        planId: normalized.planId ?? null,

        request: normalized,

        pieces,

        diff,

        status,

        tokens,

        model,

        latencyMs,
      });

      this.logAudit('calendar_stream', {
        status: 'completed',
        calendarId: normalized.calendarId,
        runId,
        userId,
        requestId,
        channels: normalized.channels,
        pieceCount: pieces.length,
        tokens,
        model,
        latencyMs,
      });

      this.streamCalendarPayload(res, pieces, {
        runId,

        summary: {
          calendarId: normalized.calendarId,

          runId,

          diff,

          pieceCount: pieces.length,

          status,
        },

        metadata: {
          provider: this.provider,

          model,

          tokens,

          latencyMs,
        },
      });
    } catch (error: unknown) {
      status =
        error instanceof ApiHttpException &&
        this.extractErrorCode(error) === 'AI_TIMEOUT'
          ? 'timeout'
          : 'failed';

      await this.persistCalendarRun({
        runId,

        calendarId: normalized.calendarId,

        userId,

        planId: normalized.planId ?? null,

        request: normalized,

        pieces,

        diff,

        status,
      }).catch(() => undefined);

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

      if (!res.writableEnded) {
        this.streamCalendarPayload(res, pieces, {
          runId,

          summary: {
            calendarId: normalized.calendarId,

            runId,

            diff,

            pieceCount: pieces.length,

            status,
          },

          metadata: { provider: this.provider, status },
        });
      }

      const errorCode = this.extractErrorCode(
        error instanceof ApiHttpException ? error : (error as Error),
      );
      const message =
        error instanceof Error ? error.message : 'unknown calendar error';

      this.logAudit('calendar_stream', {
        status,
        calendarId: normalized.calendarId,
        runId,
        userId,
        requestId,
        channels: normalized.channels,
        error: errorCode ?? 'AI_ERROR',
        message,
      });
    } finally {
      clearInterval(heartbeat);

      this.releaseCalendarLock(lockKey);
    }
  }

  private acquireCalendarLock(lockKey: string): boolean {
    if (this.calendarLocks.has(lockKey)) {
      return false;
    }

    this.calendarLocks.add(lockKey);

    return true;
  }

  private releaseCalendarLock(lockKey: string): void {
    this.calendarLocks.delete(lockKey);
  }

  async saveCalendarEntries(
    dto: SaveCalendarEntriesDto,

    context: { userId?: string; requestId?: string } = {},
  ): Promise<ApiEnvelope<{ calendarId: string; runId: string }>> {
    const userId = context.userId ?? 'anonymous';

    const runId = randomUUID();

    const pieces = this.enrichCalendarPieces(dto.entries as CalendarPiece[]);

    const client = this.supabase.getClient();

    const dateStrings = pieces.map((piece) => piece.date).filter(Boolean);

    const startDate =
      dateStrings.length > 0
        ? new Date(Math.min(...dateStrings.map((d) => Date.parse(d))))
        : new Date();

    const endDate =
      dateStrings.length > 0
        ? new Date(Math.max(...dateStrings.map((d) => Date.parse(d))))
        : startDate;

    try {
      await client.from('calendar_runs').insert({
        id: runId,

        calendar_id: dto.calendarId,

        user_id: userId,

        plan_id: dto.planId ?? null,

        status: 'completed',

        started_at: new Date().toISOString(),

        completed_at: new Date().toISOString(),

        tokens: null,

        model: null,

        latency_ms: null,

        piece_count: pieces.length,

        diff: null,

        constraints: null,

        cadence: 'manual',

        channels: Array.from(new Set(pieces.map((piece) => piece.channel))),

        start_date: startDate.toISOString().slice(0, 10),

        end_date: endDate.toISOString().slice(0, 10),
      });

      await client

        .from('calendar_entries')

        .delete()

        .eq('calendar_id', dto.calendarId)

        .eq('user_id', userId);

      if (pieces.length > 0) {
        const entryPayloads = pieces.map((piece, index) => ({
          run_id: runId,

          calendar_id: dto.calendarId,

          user_id: userId,

          plan_id: dto.planId ?? null,

          entry_key: this.buildEntryKey(piece) || `${index}`,

          payload: { ...piece, order: index },
        }));

        await client.from('calendar_entries').insert(entryPayloads);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'unknown error';

      this.logger.error(`Failed to save calendar entries: ${message}`);

      throw new ApiHttpException(
        'CALENDAR_SAVE_FAILED',

        'Could not persist calendar entries',

        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return buildSuccess(
      { calendarId: dto.calendarId, runId },

      { provider: this.provider },
    );
  }

  async getCalendar(
    calendarId: string,

    context: { userId?: string; requestId?: string } = {},
  ): Promise<ApiEnvelope<{ calendarId: string; entries: CalendarPiece[] }>> {
    const userId = context.userId ?? 'anonymous';

    const client = this.supabase.getClient();

    try {
      const { data, error } = await client

        .from('calendar_entries')

        .select('payload')

        .eq('calendar_id', calendarId)

        .eq('user_id', userId)

        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      const entries =
        data?.map((row: { payload: Record<string, unknown> }) =>
          this.deserializeCalendarPiece(row.payload),
        ) ?? [];

      return buildSuccess({ calendarId, entries }, { provider: this.provider });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'unknown error';

      this.logger.warn(`Failed to load calendar entries: ${message}`);

      throw new ApiHttpException(
        'CALENDAR_NOT_FOUND',

        'Unable to load calendar entries',

        HttpStatus.NOT_FOUND,
      );
    }
  }

  private normalizeCalendarRequest(
    dto: CalendarRequestDto,
  ): NormalizedCalendarRequest {
    const channels = (dto.channels ?? []).map((channel) => channel.trim());

    if (channels.length === 0) {
      throw new ApiHttpException(
        'CALENDAR_INVALID_CHANNELS',

        'At least one channel is required to generate a calendar.',

        HttpStatus.BAD_REQUEST,
      );
    }

    const rawStart =
      dto.start ?? (dto as { startDate?: string }).startDate ?? null;

    const rawEnd = dto.end ?? (dto as { endDate?: string }).endDate ?? null;

    if (!rawStart) {
      throw new ApiHttpException(
        'CALENDAR_INVALID_RANGE',

        'A start date is required.',

        HttpStatus.BAD_REQUEST,
      );
    }

    if (!rawEnd) {
      throw new ApiHttpException(
        'CALENDAR_INVALID_RANGE',

        'An end date is required.',

        HttpStatus.BAD_REQUEST,
      );
    }

    const startDate = new Date(rawStart);

    const endDate = new Date(rawEnd);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new ApiHttpException(
        'CALENDAR_INVALID_RANGE',

        'Start and end must be valid ISO8601 strings.',

        HttpStatus.BAD_REQUEST,
      );
    }

    if (endDate < startDate) {
      throw new ApiHttpException(
        'CALENDAR_INVALID_RANGE',

        'End date must be after start date.',

        HttpStatus.BAD_REQUEST,
      );
    }

    const cadence =
      dto.cadence ?? this.mapFrequencyToCadence(dto.frequency ?? undefined);

    const constraints: Record<string, unknown> = {};

    if (dto.constraints) {
      Object.assign(constraints, dto.constraints);
    }

    if (dto.objectives) {
      constraints.objectives = dto.objectives;
    }

    if (dto.ideas) {
      constraints.ideas = dto.ideas;
    }

    if (dto.pillars) {
      constraints.pillars = dto.pillars;
    }

    if (dto.accounts?.length) {
      constraints.accounts = dto.accounts;
    }

    return {
      channels,

      cadence,

      start: startDate.toISOString(),

      end: endDate.toISOString(),

      constraints: Object.keys(constraints).length ? constraints : null,

      calendarId: dto.calendarId ?? randomUUID(),

      planId: dto.planId,

      timezone: dto.timezone,

      objectives: dto.objectives,

      ideas: dto.ideas,

      pillars: dto.pillars,
    };
  }

  private streamCalendarPayload(
    res: Response,

    pieces: CalendarPiece[],

    context: {
      runId: string;

      summary: CalendarStreamSummary;

      metadata: Partial<ApiMeta>;
    },
  ): void {
    const total = pieces.length;

    pieces.forEach((piece, index) => {
      const envelope = {
        data: {
          type: 'calendar_piece',

          runId: context.runId,

          calendarId: context.summary.calendarId,

          index,

          total,

          piece,
        },

        error: null,

        meta: buildMeta({
          ...context.metadata,

          chunk: true,

          index,

          total,
        }),
      };

      res.write(`event: data\n`);

      res.write(`data: ${JSON.stringify(envelope)}\n\n`);
    });

    const summaryEnvelope = {
      data: {
        type: 'calendar_summary',

        ...context.summary,
      },

      error: null,

      meta: buildMeta({ ...context.metadata, done: true }),
    };

    res.write(`event: done\n`);

    res.write(`data: ${JSON.stringify(summaryEnvelope)}\n\n`);

    res.end();
  }

  private enrichCalendarPieces(pieces: CalendarPiece[]): CalendarPiece[] {
    return pieces.map((piece, index) => ({
      id: piece.id ?? randomUUID(),

      title: piece.title?.trim() ?? `Pieza ${index + 1}`,

      channel: piece.channel?.trim() ?? 'general',

      format: piece.format?.trim() ?? 'post',

      copy: piece.copy ?? '',

      script: piece.script ?? '',

      targetAudience: piece.targetAudience ?? '',

      date: piece.date ?? new Date().toISOString().slice(0, 10),

      time: piece.time ?? '09:00',

      hashtags: Array.isArray(piece.hashtags)
        ? piece.hashtags.filter((tag) => typeof tag === 'string')
        : [],
    }));
  }

  private async fetchExistingEntries(
    calendarId: string,

    userId: string,
  ): Promise<CalendarPiece[]> {
    if (!calendarId) {
      return [];
    }

    try {
      const client = this.supabase.getClient();

      const { data, error } = await client

        .from('calendar_entries')

        .select('payload')

        .eq('calendar_id', calendarId)

        .eq('user_id', userId);

      if (error) {
        this.logger.warn(
          `Failed to load existing calendar entries: ${error.message}`,
        );

        return [];
      }

      return (
        data?.map((row: { payload: Record<string, unknown> }) =>
          this.deserializeCalendarPiece(row.payload),
        ) ?? []
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'unknown error';

      this.logger.warn(
        `Unexpected error fetching calendar entries: ${message}`,
      );

      return [];
    }
  }

  private collectChannels(pieces: CalendarPiece[]): Set<SupportedChannel> {
    const channels = new Set<SupportedChannel>();

    for (const piece of pieces) {
      const raw = piece.channel?.toLowerCase() ?? '';

      if (!raw) {
        continue;
      }

      if (!SUPPORTED_CHANNELS.includes(raw as SupportedChannel)) {
        throw new ApiHttpException(
          'CHANNEL_UNSUPPORTED',

          `Channel ${piece.channel} is not supported`,

          HttpStatus.BAD_REQUEST,
        );
      }

      channels.add(raw as SupportedChannel);
    }

    return channels;
  }

  private ensureChannelAuth(channels: Set<SupportedChannel>): void {
    for (const channel of channels) {
      const envKey =
        channel === 'tiktok' ? 'TIKTOK_APP_ID' : 'INSTAGRAM_APP_ID';

      const configured = this.configService.get<string>(envKey);

      if (!configured) {
        throw new ApiHttpException(
          'CHANNEL_AUTH_MISSING',

          `Missing auth configuration for ${channel}`,

          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }

  private deserializeCalendarPiece(
    raw: Record<string, unknown>,
  ): CalendarPiece {
    const hashtagsRaw = raw.hashtags;

    const hashtags =
      Array.isArray(hashtagsRaw) &&
      hashtagsRaw.every((tag): tag is string => typeof tag === 'string')
        ? hashtagsRaw
        : [];

    return {
      id: typeof raw.id === 'string' ? raw.id : undefined,

      title: typeof raw.title === 'string' ? raw.title : 'Pieza',

      channel: typeof raw.channel === 'string' ? raw.channel : 'general',

      format: typeof raw.format === 'string' ? raw.format : 'post',

      copy: typeof raw.copy === 'string' ? raw.copy : '',

      script: typeof raw.script === 'string' ? raw.script : '',

      targetAudience:
        typeof raw.targetAudience === 'string' ? raw.targetAudience : '',

      date: typeof raw.date === 'string' ? raw.date : new Date().toISOString(),

      time: typeof raw.time === 'string' ? raw.time : '09:00',

      hashtags,
    };
  }

  private buildEntryKey(piece: CalendarPiece): string {
    return [
      piece.date?.toLowerCase() ?? '',
      piece.time?.toLowerCase() ?? '',
      piece.channel?.toLowerCase() ?? '',
      piece.title?.toLowerCase() ?? '',
    ].join('|');
  }

  private buildCsv(entries: Array<CalendarPiece & { status: string }>): string {
    const header = [
      'title',
      'channel',
      'format',
      'copy',
      'script',
      'targetAudience',
      'date',
      'time',
      'hashtags',
      'status',
    ];
    const lines = entries.map((entry) =>
      [
        entry.title,
        entry.channel,
        entry.format,
        entry.copy,
        entry.script,
        entry.targetAudience,
        entry.date,
        entry.time,
        (entry.hashtags ?? []).join(';'),
        entry.status,
      ]
        .map((value) => `"${`${value ?? ''}`.replace(/"/g, '""')}"`)
        .join(','),
    );
    return [header.join(','), ...lines].join('\n');
  }

  private computeCalendarDiff(
    previous: CalendarPiece[],
    nextPieces: CalendarPiece[],
  ): CalendarDiff {
    const previousMap = new Map<string, CalendarPiece>();

    previous.forEach((piece) => {
      previousMap.set(this.buildEntryKey(piece), piece);
    });

    const added: CalendarPiece[] = [];

    const updated: Array<{ before: CalendarPiece; after: CalendarPiece }> = [];

    for (const piece of nextPieces) {
      const key = this.buildEntryKey(piece);

      const existing = previousMap.get(key);

      if (!existing) {
        added.push(piece);

        continue;
      }

      const beforeString = JSON.stringify(existing);

      const afterString = JSON.stringify(piece);

      if (beforeString !== afterString) {
        updated.push({ before: existing, after: piece });
      }

      previousMap.delete(key);
    }

    const removed = Array.from(previousMap.values());

    return { added, updated, removed };
  }

  private async persistPublishIntent(params: {
    calendarId: string;

    runId: string | null;

    userId: string;

    channels: string[];

    entries: CalendarPiece[];

    status: 'dry_run' | 'queued' | 'failed';

    error?: Record<string, unknown> | null;
  }): Promise<string> {
    const client = this.supabase.getClient();

    const intentId = randomUUID();

    try {
      await client.from('publish_intents').insert({
        id: intentId,

        calendar_id: params.calendarId,

        run_id: params.runId,

        user_id: params.userId,

        channel: params.channels.join(','),

        payload: {
          channels: params.channels,

          entries: params.entries,
        },

        status: params.status,

        error: params.error ?? null,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'unknown error';

      this.logger.warn(`Failed to persist publish intent: ${message}`);
    }

    return intentId;
  }

  private async persistCalendarRun(params: {
    runId: string;

    calendarId: string;

    userId: string;

    planId: string | null;

    request: NormalizedCalendarRequest;

    pieces: CalendarPiece[];

    diff: CalendarDiff;

    status: 'completed' | 'timeout' | 'failed';

    tokens?: number;

    model?: string;

    latencyMs?: number;
  }): Promise<void> {
    const client = this.supabase.getClient();

    const { runId, calendarId, userId, planId, request, pieces, diff } = params;

    try {
      await client.from('calendar_runs').insert({
        id: runId,

        calendar_id: calendarId,

        user_id: userId,

        plan_id: planId,

        status: params.status,

        started_at: new Date().toISOString(),

        completed_at: new Date().toISOString(),

        tokens: params.tokens ?? null,

        model: params.model ?? null,

        latency_ms: params.latencyMs ?? null,

        piece_count: pieces.length,

        diff,

        constraints: request.constraints,

        cadence: request.cadence,

        channels: request.channels,

        start_date: request.start.slice(0, 10),

        end_date: request.end.slice(0, 10),
      });

      if (pieces.length === 0) {
        return;
      }

      const entryPayloads = pieces.map((piece, index) => ({
        run_id: runId,

        calendar_id: calendarId,

        user_id: userId,

        plan_id: planId,

        entry_key: this.buildEntryKey(piece) || `${index}`,

        payload: { ...piece, order: index },
      }));

      await client.from('calendar_entries').insert(entryPayloads);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'unknown error';

      this.logger.warn(`Failed to persist calendar run: ${message}`);
    }
  }

  private extractErrorCode(error: ApiHttpException | Error): string | null {
    if (!(error instanceof ApiHttpException)) {
      return null;
    }

    const response = error.getResponse() as {
      error?: { code?: string };
    };

    return response?.error?.code ?? null;
  }

  private buildCalendarPrompt(request: NormalizedCalendarRequest): string {
    const constraints: string[] = [];

    if (request.constraints) {
      for (const [key, value] of Object.entries(request.constraints)) {
        if (value === undefined || value === null || value === '') continue;

        constraints.push(`- ${key}: ${JSON.stringify(value)}`);
      }
    }

    const cadenceLabel = this.cadenceLabel(request.cadence);

    return [
      'Genera un calendario editorial creativo y estrategico en espanol.',

      `Rango de fechas: ${request.start} al ${request.end}.`,

      `Cadencia solicitada: ${cadenceLabel}.`,

      `Canales prioritarios: ${request.channels.join(', ')}.`,

      constraints.length
        ? ['Restricciones y contexto:', ...constraints].join('\n')
        : 'Usa la informacion disponible para personalizar cada pieza.',

      'Regresa JSON con la forma { "pieces": [ { "title", "channel", "format", "copy", "script", "targetAudience", "date", "time", "hashtags" } ] }.',

      'Emplea lenguaje espanol claro y profesional.',

      'Respeta el rango de fechas, evita duplicados y distribuye las piezas de acuerdo a la cadencia solicitada.',
    ].join('\n');
  }

  private mapFrequencyToCadence(frequency?: number): CalendarCadence {
    if (!frequency || Number.isNaN(frequency)) {
      return CalendarCadence.WEEKLY;
    }
    if (frequency >= 20) {
      return CalendarCadence.DAILY;
    }
    if (frequency >= 5) {
      return CalendarCadence.WEEKLY;
    }
    return CalendarCadence.MONTHLY;
  }

  private cadenceLabel(cadence: CalendarCadence): string {
    switch (cadence) {
      case CalendarCadence.DAILY:
        return 'diaria';
      case CalendarCadence.WEEKLY:
        return 'semanal';
      case CalendarCadence.MONTHLY:
        return 'mensual';
      default:
        return 'mensual';
    }
  }

  private parseCalendar(
    content: string,

    request: NormalizedCalendarRequest,
  ): CalendarPiece[] {
    try {
      const match = content.match(/\{[\s\S]*\}/);

      if (!match) {
        throw new Error('No JSON found');
      }

      const parsed = JSON.parse(match[0]) as {
        pieces?: Array<Record<string, unknown>>;
      };

      if (!Array.isArray(parsed.pieces)) {
        throw new Error('Invalid pieces array');
      }

      return parsed.pieces

        .map((piece) => this.deserializeCalendarPiece(piece))

        .filter(Boolean);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'unknown error';

      this.logger.warn(`Failed to parse calendar response: ${message}`);

      return [
        {
          id: randomUUID(),

          title: 'Borrador de calendario',

          channel: request.channels[0] ?? 'general',

          format: 'post',

          copy: 'Este es un borrador generado automáticamente. Ajusta el mensaje para alinearlo con tu marca.',

          script: 'Introducción\nMensajes clave\nLlamado a la acción',

          targetAudience: 'Audiencia principal',

          date: request.start,

          time: '09:00',

          hashtags: ['calendario', 'ai', 'pendiente'],
        },
      ];
    }
  }

  private extractJsonObject(text: string): string {
    const trimmed = text.trim();

    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      return trimmed;
    }

    const match = trimmed.match(/\{[\s\S]*\}/);

    if (match?.[0]) {
      return match[0];
    }

    throw new ApiHttpException(
      'AI_PLAN_INVALID_JSON',
      'AI response did not include a JSON object',
      HttpStatus.BAD_GATEWAY,
    );
  }

  private parsePlanJson(
    jsonText: string,
    dto: GeneratePlanFormDto,
  ): StructuredPlan {
    let parsed: unknown;

    try {
      parsed = JSON.parse(jsonText);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Invalid JSON payload';

      throw new ApiHttpException(
        'AI_PLAN_INVALID_JSON',
        'AI response is not valid JSON',
        HttpStatus.BAD_GATEWAY,
        undefined,
        { message },
      );
    }

    const validation = planSchema.safeParse(parsed);

    if (!validation.success) {
      throw new ApiHttpException(
        'AI_PLAN_SCHEMA_INVALID',
        'AI response is missing required fields',
        HttpStatus.BAD_GATEWAY,
        undefined,
        {
          issues: validation.error.errors.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
      );
    }

    const normalizedRoute = this.normalizeRoute(
      validation.data.ruta_seleccionada,
    );

    const safeName =
      validation.data.metadata.nombre?.trim() ||
      dto.nombre?.trim() ||
      'Creador';

    const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(validation.data.metadata.fecha)
      ? validation.data.metadata.fecha
      : new Date().toISOString().slice(0, 10);

    const ideas = [...validation.data.ideas_contenido].sort(
      (a, b) => a.numero - b.numero,
    );

    const plan: StructuredPlan = {
      ...validation.data,

      ruta_seleccionada: normalizedRoute,

      metadata: {
        ...validation.data.metadata,

        nombre: safeName,

        fecha: safeDate,
      },

      ideas_contenido: ideas,
    };

    this.ensureIdeaVolume(plan);

    return plan;
  }

  private ensureIdeaVolume(plan: StructuredPlan): void {
    const route = this.normalizeRoute(plan.ruta_seleccionada);

    const minIdeas =
      route === 'ENTRETENIMIENTO' ? 20 : route === 'EDUCACION' ? 12 : 8;

    if (plan.ideas_contenido.length < minIdeas) {
      throw new ApiHttpException(
        'AI_PLAN_INCOMPLETE',
        `AI response included ${plan.ideas_contenido.length} ideas, expected at least ${minIdeas}`,
        HttpStatus.BAD_GATEWAY,
        undefined,
        {
          route,
          received: plan.ideas_contenido.length,
          expected: minIdeas,
        },
      );
    }
  }

  private renderPlanTemplate(plan: StructuredPlan): string {
    const lines: string[] = [
      `Plan de contenido para ${plan.metadata.nombre} (${plan.metadata.fecha})`,

      `Ruta seleccionada: ${plan.ruta_seleccionada}`,

      '',

      'Explicacion de la ruta:',

      plan.explicacion_ruta,

      '',

      'Perfil de audiencia:',

      `- Descripcion general: ${plan.perfil_audiencia.descripcion_general}`,

      `- Demografia: ${plan.perfil_audiencia.demografia}`,

      `- Psicografia: ${plan.perfil_audiencia.psicografia}`,

      `- Pain points: ${plan.perfil_audiencia.pain_points.join('; ')}`,

      `- Aspiraciones: ${plan.perfil_audiencia.aspiraciones.join('; ')}`,

      `- Lenguaje recomendado: ${plan.perfil_audiencia.lenguaje_recomendado}`,

      '',

      'Fundamentos:',

      ...plan.fundamentos.pilares_contenido.map(
        (pilar, index) =>
          `Pilar ${index + 1}: ${pilar.nombre} - ${pilar.descripcion} (proposito: ${pilar.proposito})`,
      ),

      `Tono de voz: ${plan.fundamentos.tono_voz}`,

      `Propuesta de valor: ${plan.fundamentos.propuesta_valor}`,

      '',

      'Ideas de contenido (primeras 10):',

      ...plan.ideas_contenido
        .slice(0, 10)
        .map(
          (idea) =>
            `#${idea.numero} ${idea.tema} | Hook: ${idea.hook} | CTA: ${idea.cta}`,
        ),

      plan.ideas_contenido.length > 10
        ? `Total de ideas: ${plan.ideas_contenido.length}. Revisa ideas_contenido para el resto.`
        : '',

      '',

      'Recomendaciones:',

      `- Frecuencia: ${plan.recomendaciones.frecuencia_publicacion}`,

      `- Horarios: ${plan.recomendaciones.mejores_horarios}`,

      `- Hashtags: ${plan.recomendaciones.hashtags_sugeridos.join(', ')}`,

      `- Formatos prioritarios: ${plan.recomendaciones.formatos_prioritarios.join(', ')}`,

      `- Metricas clave: ${plan.recomendaciones.metricas_clave.join(', ')}`,

      `- Consejos magicos: ${plan.recomendaciones.consejos_magicos.join('; ')}`,
    ].filter(Boolean);

    return lines.join('\n');
  }

  private buildPlanPromptFromForm(dto: GeneratePlanFormDto): string {
    const temas = (dto.temas ?? []).filter(Boolean);

    const temasLine = temas.length > 0 ? temas.join(', ') : 'No especificados';

    const sampleName = (dto.nombre ?? 'Creador').replace(/"/g, '\\"');

    const today = new Date().toISOString().slice(0, 10);

    const formatBlock = [
      '{',
      '  "ruta_seleccionada": "ENTRETENIMIENTO o EDUCACION",',
      '  "explicacion_ruta": "Explicacion breve de la ruta elegida",',
      `  "metadata": { "nombre": "${sampleName}", "fecha": "${today}" },`,
      '  "perfil_audiencia": { "descripcion_general": "", "demografia": "", "psicografia": "", "pain_points": ["p1","p2","p3"], "aspiraciones": ["a1","a2","a3"], "lenguaje_recomendado": "" },',
      '  "fundamentos": { "pilares_contenido": [ { "nombre": "", "descripcion": "", "proposito": "" }, { "nombre": "", "descripcion": "", "proposito": "" }, { "nombre": "", "descripcion": "", "proposito": "" } ], "tono_voz": "", "propuesta_valor": "" },',
      '  "ideas_contenido": [ { "numero": 1, "tema": "", "hook": "", "desarrollo": "", "punto_quiebre": "", "cta": "", "copy": "", "pilar": "" } ],',
      '  "recomendaciones": { "frecuencia_publicacion": "", "mejores_horarios": "", "hashtags_sugeridos": ["tag1","tag2"], "formatos_prioritarios": ["formato1","formato2"], "metricas_clave": ["metrica1","metrica2"], "consejos_magicos": ["tip1","tip2","tip3"] }',
      '}',
    ].join('\n');

    return [
      'Eres el asistente magico de IREAL. Tu mision es ayudar a los creadores a transformar ideas en contenido.',

      'Debes responder con tono inspirador, claro, con secciones y valor tactico.',

      'INSTRUCCION CRITICA:',

      '- Responde UNICAMENTE con un objeto JSON valido.',

      '- No uses bloques de codigo ni markdown.',

      '- No agregues texto antes ni despues del JSON; la respuesta debe iniciar con { y terminar con }.',

      '',

      'DATOS DEL USUARIO:',

      `email: ${dto.email ?? 'no especificado'}`,

      `nombre: ${dto.nombre ?? 'Creador'}`,

      `pasion: ${dto.pasion ?? 'No especificada'}`,

      `motivacion: ${dto.motivacion ?? 'No especificada'}`,

      `conexion: ${dto.conexion ?? 'No especificada'}`,

      `temas: ${temasLine}`,

      `vision: ${dto.vision ?? 'No especificada'}`,

      `tiempo: ${dto.tiempo ?? 'No especificado'}`,

      '',

      'TAREAS:',

      '1. CLASIFICACION DE RUTA: Determina si el contenido debe ser ENTRETENIMIENTO (crecimiento rapido, tono casual/divertido) o EDUCACION (expertise/ventas, tono educativo).',

      '2. PERFIL DE AUDIENCIA: descripcion_general (2-3 parrafos), demografia, psicografia, pain_points (3), aspiraciones (3), lenguaje_recomendado.',

      '3. FUNDAMENTOS: 3 pilares_contenido (nombre, descripcion, proposito), tono_voz y propuesta_valor.',

      '4. IDEAS DE CONTENIDO: Si la ruta es ENTRETENIMIENTO genera minimo 20 ideas. Si es EDUCACION genera minimo 12 ideas. Cada idea incluye numero, tema, hook, desarrollo, punto_quiebre, cta, copy, pilar.',

      '5. RECOMENDACIONES: frecuencia_publicacion, mejores_horarios, hashtags_sugeridos (5-8), formatos_prioritarios (3-5), metricas_clave (4-6), consejos_magicos (3).',

      '',

      'FORMATO DE SALIDA:',

      formatBlock,

      'Usa metadata.nombre exactamente como viene en los datos del usuario y metadata.fecha en formato YYYY-MM-DD.',
    ].join('\n');
  }

  private normalizeRoute(route: string): string {
    const normalized = route
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .trim();

    if (normalized.includes('ENTRETENIMIENTO')) {
      return 'ENTRETENIMIENTO';
    }

    if (normalized.includes('EDUCACION')) {
      return 'EDUCACION';
    }

    return route.trim();
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
}
