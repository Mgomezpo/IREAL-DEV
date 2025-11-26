import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { PlansService } from './plans.service';
import { AiService } from '../ai/ai.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { ApiHttpException } from '../common/envelope';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { ReorderSectionsDto } from './dto/reorder-sections.dto';
import { AttachIdeasDto } from './dto/attach-ideas.dto';
import { RateLimit } from '../common/rate-limit/rate-limit.decorator';

const USER_ID_HEADER = 'x-user-id';

const resolveUserId = (req: Request): string => {
  const header = req.headers[USER_ID_HEADER];
  const userId = Array.isArray(header) ? header[0] : header;
  if (!userId) {
    throw new ApiHttpException(
      'UNAUTHORIZED',
      'User context is required',
      HttpStatus.UNAUTHORIZED,
    );
  }
  return String(userId);
};

@Controller('v1/plans')
export class PlansController {
  constructor(private readonly plansService: PlansService, private readonly aiService: AiService) {}

  @Get()
  list(@Req() req: Request) {
    const userId = resolveUserId(req);
    return this.plansService.listPlans(userId);
  }

  @Get(':planId')
  get(@Req() req: Request, @Param('planId') planId: string) {
    const userId = resolveUserId(req);
    return this.plansService.getPlanById(userId, planId);
  }

  @Post()
  @RateLimit('write')
  create(@Req() req: Request, @Body() dto: CreatePlanDto) {
    const userId = resolveUserId(req);
    return this.plansService.createPlan(userId, dto);
  }

  @Post(':planId/generate-strategy')
  @RateLimit('write')
  generateStrategy(@Req() req: Request, @Param('planId') planId: string) {
    const userId = resolveUserId(req);
    return this.aiService.generatePlanStrategy(userId, planId);
  }

  @Patch(':planId')
  @RateLimit('write')
  update(
    @Req() req: Request,
    @Param('planId') planId: string,
    @Body() dto: UpdatePlanDto,
  ) {
    const userId = resolveUserId(req);
    return this.plansService.updatePlan(userId, planId, dto);
  }

  @Delete(':planId')
  @RateLimit('write')
  @HttpCode(204)
  async remove(@Req() req: Request, @Param('planId') planId: string) {
    const userId = resolveUserId(req);
    await this.plansService.deletePlan(userId, planId);
  }

  @Get(':planId/sections')
  listSections(@Req() req: Request, @Param('planId') planId: string) {
    const userId = resolveUserId(req);
    return this.plansService.listSections(userId, planId);
  }

  @Post(':planId/sections')
  @RateLimit('write')
  createSection(
    @Req() req: Request,
    @Param('planId') planId: string,
    @Body() dto: CreateSectionDto,
  ) {
    const userId = resolveUserId(req);
    return this.plansService.createSection(userId, planId, dto);
  }

  @Patch(':planId/sections/:sectionId')
  @RateLimit('write')
  updateSection(
    @Req() req: Request,
    @Param('planId') planId: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: UpdateSectionDto,
  ) {
    const userId = resolveUserId(req);
    return this.plansService.updateSection(userId, planId, sectionId, dto);
  }

  @Delete(':planId/sections/:sectionId')
  @RateLimit('write')
  @HttpCode(204)
  async removeSection(
    @Req() req: Request,
    @Param('planId') planId: string,
    @Param('sectionId') sectionId: string,
  ) {
    const userId = resolveUserId(req);
    await this.plansService.deleteSection(userId, planId, sectionId);
  }

  @Post(':planId/sections:reorder')
  @RateLimit('write')
  reorderSections(
    @Req() req: Request,
    @Param('planId') planId: string,
    @Body() dto: ReorderSectionsDto,
  ) {
    const userId = resolveUserId(req);
    return this.plansService.reorderSections(userId, planId, dto);
  }

  @Post(':planId/ideas:attach')
  @RateLimit('write')
  attachIdeas(
    @Req() req: Request,
    @Param('planId') planId: string,
    @Body() dto: AttachIdeasDto,
  ) {
    const userId = resolveUserId(req);
    return this.plansService.attachIdeas(userId, planId, dto);
  }
}
