import { IsString, IsOptional, IsDateString, IsUrl } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class CreateUserDetailsDto {
  @ApiPropertyOptional({ example: 'Pérez' })
  @IsOptional()
  @IsString()
  paternalLastName?: string

  @ApiPropertyOptional({ example: 'García' })
  @IsOptional()
  @IsString()
  maternalLastName?: string

  @ApiPropertyOptional({ example: 'Juan Carlos' })
  @IsString()
  firstNames: string

  @ApiPropertyOptional({ example: '1995-08-15' })
  @IsOptional()
  @IsDateString()
  birthDate?: string

  @ApiPropertyOptional({ example: '+591 70012345' })
  @IsOptional()
  @IsString()
  cellphone?: string

  @ApiPropertyOptional({ example: 'Bolivia' })
  @IsOptional()
  @IsString()
  country?: string

  @ApiPropertyOptional({ example: 'Cochabamba' })
  @IsOptional()
  @IsString()
  department?: string

  @ApiPropertyOptional({ example: 'https://cdn.example.com/foto.jpg' })
  @IsOptional()
  @IsUrl({}, { message: 'photoUrl debe ser una URL válida' })
  photoUrl?: string
}

export class UpdateUserDetailsDto {
  @ApiPropertyOptional({ example: 'Pérez' })
  @IsOptional()
  @IsString()
  paternalLastName?: string

  @ApiPropertyOptional({ example: 'García' })
  @IsOptional()
  @IsString()
  maternalLastName?: string

  @ApiPropertyOptional({ example: 'Juan Carlos' })
  @IsOptional()
  @IsString()
  firstNames?: string

  @ApiPropertyOptional({ example: '1995-08-15' })
  @IsOptional()
  @IsDateString()
  birthDate?: string

  @ApiPropertyOptional({ example: '+591 70012345' })
  @IsOptional()
  @IsString()
  cellphone?: string

  @ApiPropertyOptional({ example: 'Bolivia' })
  @IsOptional()
  @IsString()
  country?: string

  @ApiPropertyOptional({ example: 'Cochabamba' })
  @IsOptional()
  @IsString()
  department?: string

  @ApiPropertyOptional({ example: 'https://cdn.example.com/foto.jpg' })
  @IsOptional()
  @IsUrl({}, { message: 'photoUrl debe ser una URL válida' })
  photoUrl?: string
}
