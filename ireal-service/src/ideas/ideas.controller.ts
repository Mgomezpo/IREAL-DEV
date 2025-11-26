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
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { IdeasService } from './ideas.service';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { UpdateIdeaDto } from './dto/update-idea.dto';
import { ListIdeasQueryDto } from './dto/list-ideas-query.dto';
import { AttachPlansDto } from './dto/attach-plans.dto';
import { RateLimit } from '../common/rate-limit/rate-limit.decorator';
import { ApiHttpException } from '../common/envelope';

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

@Controller('v1/ideas')
export class IdeasController {
  constructor(private readonly ideasService: IdeasService) {}

  @Get()
  list(@Req() req: Request, @Query() query: ListIdeasQueryDto) {
    const userId = resolveUserId(req);
    return this.ideasService.listIdeas(userId, query);
  }

  @Get(':id')
  getById(@Req() req: Request, @Param('id') id: string) {
    const userId = resolveUserId(req);
    return this.ideasService.getIdeaById(userId, id);
  }

  @Get('by-plan/:planId')
  listByPlan(@Req() req: Request, @Param('planId') planId: string) {
    const userId = resolveUserId(req);
    return this.ideasService.listIdeasByPlan(userId, planId);
  }

  @Post()
  @RateLimit('write')
  create(@Req() req: Request, @Body() body: CreateIdeaDto) {
    const userId = resolveUserId(req);
    return this.ideasService.createIdea(userId, body);
  }

  @Patch(':id')
  @RateLimit('write')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: UpdateIdeaDto,
  ) {
    const userId = resolveUserId(req);
    return this.ideasService.updateIdea(userId, id, body);
  }

  @Delete(':id')
  @RateLimit('write')
  @HttpCode(204)
  async remove(@Req() req: Request, @Param('id') id: string) {
    const userId = resolveUserId(req);
    await this.ideasService.deleteIdea(userId, id);
  }

  @Post(':id/attach-plans')
  @RateLimit('write')
  attachPlans(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: AttachPlansDto,
  ) {
    const userId = resolveUserId(req);
    return this.ideasService.attachPlans(userId, id, body);
  }
}
