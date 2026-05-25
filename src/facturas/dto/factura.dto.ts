import { IsDateString, IsNotEmpty, IsString } from 'class-validator'

export class CreateFacturaDto {
  @IsString()
  @IsNotEmpty()
  readonly nombre!: string

  @IsString()
  @IsNotEmpty()
  readonly nit!: string

  @IsDateString()
  @IsNotEmpty()
  readonly fecha!: string
}