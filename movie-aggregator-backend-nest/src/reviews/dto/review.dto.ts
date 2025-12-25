import { IsString, IsInt, IsOptional, IsNumber, Min, Max, IsObject } from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  content_id: number;

  @IsString()
  content: string;

  @IsOptional()
  @IsObject()
  aspects?: Record<string, number>;

  @IsOptional()
  @IsObject()
  emotions?: Record<string, number>;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  rating?: number;
}

export class PublishProReviewDto {
  @IsInt()
  content_id: number;

  @IsString()
  review_text: string;

  @IsObject()
  aspects: Record<string, number>;

  @IsObject()
  emotions: Record<string, number>;

  @IsNumber()
  @Min(0)
  @Max(10)
  rating: number;
}
