import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class RegisterDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  name: string

  @ApiProperty({ example: 'juan@example.com' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string

  @ApiProperty({ example: 'contraseña123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string

  @ApiPropertyOptional({ enum: ['student', 'instructor'], default: 'student' })
  @IsOptional()
  @IsIn(['student', 'instructor'])
  role?: 'student' | 'instructor'
}
