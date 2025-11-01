import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiEnvelope } from '../common/envelope';
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
import { CalendarRequestDto } from './dto/calendar.dto';
import { PlanAssistDto } from './dto/plan-assist.dto';

@Controller('v1/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate')
  generate(@Body() dto: GenerateAiDto): Promise<ApiEnvelope<AiGenerationData>> {
    return this.aiService.generate(dto);
  }

  @Post('plan-chat')
  planChat(@Body() dto: PlanChatDto): Promise<ApiEnvelope<AiPlanChatData>> {
    return this.aiService.planChat(dto);
  }

  @Post('nudge')
  nudge(@Body() dto: NudgeDto): Promise<ApiEnvelope<AiNudgeData>> {
    return this.aiService.nudge(dto);
  }

  @Post('plans')
  planAssist(
    @Body() dto: PlanAssistDto,
  ): Promise<ApiEnvelope<AiPlanAssistData>> {
    return this.aiService.planAssist(dto);
  }

  @Post('calendar')
  calendar(
    @Body() dto: CalendarRequestDto,
    @Res() res: Response,
  ): Promise<void> {
    return this.aiService.streamCalendar(dto, res);
  }
}
