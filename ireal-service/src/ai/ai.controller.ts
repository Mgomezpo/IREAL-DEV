import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiEnvelope } from '../common/envelope';
import { RateLimit } from '../common/rate-limit/rate-limit.decorator';
import { RateLimitGuard } from '../common/rate-limit/rate-limit.guard';
import {
  AiGenerationData,
  AiNudgeData,
  AiPlanAssistData,
  AiPlanChatData,
} from './ai.service';
import { AiService } from './ai.service';
import { GenerateAiDto } from './dto/generate-ai.dto';
import { PlanChatDto } from './dto/plan-chat.dto';
import { NudgeDto } from './dto/nudge.dto';
import { CalendarRequestDto, SaveCalendarEntriesDto } from './dto/calendar.dto';
import { PlanAssistDto } from './dto/plan-assist.dto';

@Controller('v1/ai')
@UseGuards(RateLimitGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate')
  @RateLimit('ai')
  generate(@Body() dto: GenerateAiDto): Promise<ApiEnvelope<AiGenerationData>> {
    return this.aiService.generate(dto);
  }

  @Post('plan-chat')
  @RateLimit('ai')
  planChat(@Body() dto: PlanChatDto): Promise<ApiEnvelope<AiPlanChatData>> {
    return this.aiService.planChat(dto);
  }

  @Post('nudge')
  @RateLimit('ai')
  nudge(@Body() dto: NudgeDto): Promise<ApiEnvelope<AiNudgeData>> {
    return this.aiService.nudge(dto);
  }

  @Post('plans')
  @RateLimit('ai')
  planAssist(
    @Body() dto: PlanAssistDto,
  ): Promise<ApiEnvelope<AiPlanAssistData>> {
    return this.aiService.planAssist(dto);
  }

  @Post('calendar')
  @RateLimit('ai')
  calendar(
    @Body() dto: CalendarRequestDto,
    @Res() res: Response,
    @Headers('x-user-id') userId?: string,
    @Headers('x-request-id') requestId?: string,
  ): Promise<void> {
    return this.aiService.streamCalendar(dto, res, { userId, requestId });
  }

  @Post('calendar/save')
  @RateLimit('ai')
  saveCalendarEntries(
    @Body() dto: SaveCalendarEntriesDto,
    @Headers('x-user-id') userId?: string,
    @Headers('x-request-id') requestId?: string,
  ): Promise<ApiEnvelope<{ calendarId: string; runId: string }>> {
    return this.aiService.saveCalendarEntries(dto, { userId, requestId });
  }

  @Get('calendar/:calendarId')
  @RateLimit('ai')
  getCalendar(
    @Param('calendarId') calendarId: string,
    @Headers('x-user-id') userId?: string,
    @Headers('x-request-id') requestId?: string,
  ): Promise<ApiEnvelope<{ calendarId: string; entries: unknown[] }>> {
    return this.aiService.getCalendar(calendarId, { userId, requestId });
  }
}
