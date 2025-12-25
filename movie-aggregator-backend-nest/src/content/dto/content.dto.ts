import { IsString, IsEnum, IsOptional, IsInt, Min, Max, IsNumber } from 'class-validator';
import { ContentType } from '../entities/content.entity';

export class CreateContentDto {
  @IsString()
  title: string;

  @IsEnum(ContentType)
  content_type: ContentType;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  release_year?: number;

  @IsOptional()
  @IsString()
  genre?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  poster_url?: string;

  @IsOptional()
  @IsString()
  trailer_url?: string;

  // Movie/Series
  @IsOptional()
  @IsString()
  director?: string;

  @IsOptional()
  @IsString()
  cast?: string; // comma-separated

  @IsOptional()
  @IsString()
  director_photo_url?: string;

  @IsOptional()
  cast_photos?: string[]; // array of URLs

  @IsOptional()
  @IsInt()
  runtime?: number;

  // Game specific
  @IsOptional()
  @IsString()
  developer?: string;

  @IsOptional()
  @IsString()
  publisher?: string;

  @IsOptional()
  @IsString()
  platforms?: string; // comma-separated string from form; backend may parse later

  @IsOptional()
  @IsString()
  esrb_rating?: string;

  @IsOptional()
  @IsString()
  players?: string;

  @IsOptional()
  @IsString()
  file_size?: string;

  @IsOptional()
  technical_info?: any;
}

export class UpdateContentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsInt()
  release_year?: number;

  @IsOptional()
  @IsString()
  genre?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  poster_url?: string;

  @IsOptional()
  @IsString()
  trailer_url?: string;

  // Movie/Series
  @IsOptional()
  @IsString()
  director?: string;

  @IsOptional()
  @IsString()
  cast?: string;

  @IsOptional()
  @IsString()
  director_photo_url?: string;

  @IsOptional()
  cast_photos?: string[];

  @IsOptional()
  @IsInt()
  runtime?: number;

  // Game specific
  @IsOptional()
  @IsString()
  developer?: string;

  @IsOptional()
  @IsString()
  publisher?: string;

  @IsOptional()
  @IsString()
  platforms?: string;

  @IsOptional()
  @IsString()
  esrb_rating?: string;

  @IsOptional()
  @IsString()
  players?: string;

  @IsOptional()
  @IsString()
  file_size?: string;

  @IsOptional()
  technical_info?: any;
}

export class SearchContentDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsEnum(ContentType)
  content_type?: ContentType;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
