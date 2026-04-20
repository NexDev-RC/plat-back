import {
  IsString, IsNumber, IsOptional, IsBoolean, IsIn,
  IsArray, IsUrl, Min, ValidateNested, IsUUID,
} from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'

// ─── Lesson ───────────────────────────────────────────────────────────────────

export class CreateLessonDto {
  @ApiProperty({ example: 'Introducción a React' })
  @IsString()
  title: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({ example: 'https://...' })
  @IsOptional()
  @IsUrl()
  videoUrl?: string

  @ApiProperty({ example: 600, description: 'Duración en segundos' })
  @IsNumber()
  @Min(1)
  duration: number

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  order: number

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFree?: boolean
}

// ─── Section ──────────────────────────────────────────────────────────────────

export class CreateSectionDto {
  @ApiProperty({ example: 'Fundamentos de React' })
  @IsString()
  title: string

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  order: number

  @ApiPropertyOptional({ type: [CreateLessonDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLessonDto)
  lessons?: CreateLessonDto[]
}

// ─── Course ───────────────────────────────────────────────────────────────────

export class CreateCourseDto {
  @ApiProperty({ example: 'React y Next.js 15: Desarrollo Web Moderno' })
  @IsString()
  title: string

  @ApiProperty({ example: 'Aprende React desde cero...' })
  @IsString()
  description: string

  @ApiProperty({ example: 'Domina el desarrollo frontend moderno.' })
  @IsString()
  shortDescription: string

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/...' })
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  previewVideoUrl?: string

  @ApiProperty({ example: 49 })
  @IsNumber()
  @Min(0)
  price: number

  @ApiPropertyOptional({ example: 19 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountPrice?: number

  @ApiProperty({ enum: ['beginner', 'intermediate', 'advanced'] })
  @IsIn(['beginner', 'intermediate', 'advanced'])
  level: 'beginner' | 'intermediate' | 'advanced'

  @ApiProperty({ example: 'Español' })
  @IsString()
  language: string

  @ApiProperty({ example: 'uuid-de-la-categoria' })
  @IsUUID()
  categoryId: string

  @ApiPropertyOptional({ type: [String], example: ['React', 'TypeScript'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @ApiPropertyOptional({ type: [CreateSectionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSectionDto)
  sections?: CreateSectionDto[]
}

export class UpdateCourseDto extends PartialType(CreateCourseDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean
}

// ─── Filtros de búsqueda ─────────────────────────────────────────────────────

export class CourseFiltersDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string

  @ApiPropertyOptional({ enum: ['beginner', 'intermediate', 'advanced'] })
  @IsOptional()
  @IsIn(['beginner', 'intermediate', 'advanced'])
  level?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minPrice?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxPrice?: number

  @ApiPropertyOptional({ enum: ['newest', 'popular', 'rating', 'price-asc', 'price-desc'] })
  @IsOptional()
  @IsIn(['newest', 'popular', 'rating', 'price-asc', 'price-desc'])
  sortBy?: string

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number

  @ApiPropertyOptional({ default: 12 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number
}
