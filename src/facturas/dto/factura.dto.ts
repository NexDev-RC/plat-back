import { IsString, IsNotEmpty, IsDateString } from 'class-validator'

export class CreateFacturaDto {
  @IsString()
  @IsNotEmpty()
  readonly nombre: string

  @IsString()
  @IsNotEmpty()
  readonly nit: string

  @IsDateString()
  @IsNotEmpty()
  readonly fecha: string
}
