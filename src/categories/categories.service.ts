import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { SupabaseService } from '../common/supabase/supabase.service'
import { IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateCategoryDto {
  @ApiProperty({ example: 'Programación' })
  @IsString()
  name: string
}

@Injectable()
export class CategoriesService {
  constructor(private supabase: SupabaseService) {}

  async findAll() {
    const { data, error } = await this.supabase.admin
      .from('categories')
      .select('id, name, slug, created_at')
      .order('name')

    if (error) throw new Error(error.message)
    return data
  }

  async create(dto: CreateCategoryDto) {
    const slugify = (await import('slugify')).default
    const slug = slugify(dto.name, { lower: true, strict: true })

    const { data: existing } = await this.supabase.admin
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) throw new ConflictException('Ya existe una categoría con ese nombre')

    const { data, error } = await this.supabase.admin
      .from('categories')
      .insert({ name: dto.name, slug })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }

  async remove(id: string) {
    const { error } = await this.supabase.admin
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) throw new NotFoundException('Categoría no encontrada')
    return { message: 'Categoría eliminada' }
  }
}
