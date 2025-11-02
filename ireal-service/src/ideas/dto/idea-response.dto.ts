export interface IdeaDto {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedIdeasDto {
  items: IdeaDto[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}
