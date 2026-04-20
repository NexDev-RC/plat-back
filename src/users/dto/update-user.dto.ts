import { IsString, IsOptional, IsIn, IsUrl } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Juan Pérez' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ example: 'https://...' })
  @IsOptional()
  @IsUrl({}, { message: 'avatarUrl debe ser una URL válida' })
  avatarUrl?: string

  @ApiPropertyOptional({ example: 'Desarrollador full-stack con 5 años de experiencia' })
  @IsOptional()
  @IsString()
  bio?: string
}

export class UpdateUserRoleDto {
  @ApiPropertyOptional({ enum: ['student', 'instructor', 'admin'] })
  @IsIn(['student', 'instructor', 'admin'])
  role: 'student' | 'instructor' | 'admin'
}
