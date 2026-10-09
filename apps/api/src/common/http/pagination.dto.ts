import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

const INVALID_PAGINATION =
  'page ต้องเป็นจำนวนเต็มตั้งแต่ 1 และ limit ต้องเป็นจำนวนเต็มระหว่าง 1 ถึง 100';

export const MAX_PAGE_SIZE = 100;

/** `?page=&limit=` query shared by history endpoints. */
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: INVALID_PAGINATION })
  @Min(1, { message: INVALID_PAGINATION })
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: INVALID_PAGINATION })
  @Min(1, { message: INVALID_PAGINATION })
  @Max(MAX_PAGE_SIZE, { message: INVALID_PAGINATION })
  limit: number = 20;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  totalItems: number;
}
