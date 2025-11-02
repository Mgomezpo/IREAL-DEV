import type { PlanStatus } from './create-plan.dto';

export interface PlanSectionDto {
  id: string;
  planId: string;
  title: string;
  sectionType: string | null;
  content: Record<string, unknown> | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlanDto {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  status: PlanStatus;
  channels: string[] | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  sections?: PlanSectionDto[];
}

export interface PlansListDto {
  items: PlanDto[];
}
