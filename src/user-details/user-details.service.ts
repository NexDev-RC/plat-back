import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common'
import { SupabaseService } from '../common/supabase/supabase.service'
import { CreateUserDetailsDto, UpdateUserDetailsDto } from './dto/user-details.dto'

@Injectable()
export class UserDetailsService {
  constructor(private supabase: SupabaseService) {}

  // ── Obtener detalles por user_id ───────────────────────────────────────────

  async findByUserId(userId: string) {
    const { data, error } = await this.supabase.admin
      .from('user_details')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !data) throw new NotFoundException('Detalles de usuario no encontrados')

    return this.format(data)
  }

  // ── Obtener detalles por id primario (solo admin) ──────────────────────────

  async findById(id: string) {
    const { data, error } = await this.supabase.admin
      .from('user_details')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) throw new NotFoundException('Detalles de usuario no encontrados')

    return this.format(data)
  }

  // ── Listar todos (solo admin) ──────────────────────────────────────────────

  async findAll(page = 1, limit = 20) {
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await this.supabase.admin
      .from('user_details')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw new Error(error.message)

    return {
      data: (data ?? []).map(this.format),
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    }
  }

  // ── Crear detalles ─────────────────────────────────────────────────────────

  async create(userId: string, dto: CreateUserDetailsDto) {
    // Verificar que no existan ya detalles para este usuario
    const { data: existing } = await this.supabase.admin
      .from('user_details')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) {
      throw new ConflictException('Ya existen detalles para este usuario. Usa PATCH para actualizar.')
    }

    const { data, error } = await this.supabase.admin
      .from('user_details')
      .insert({
        user_id: userId,
        paternal_last_name: dto.paternalLastName ?? null,
        maternal_last_name: dto.maternalLastName ?? null,
        first_names: dto.firstNames,
        birth_date: dto.birthDate ?? null,
        cellphone: dto.cellphone ?? null,
        country: dto.country ?? null,
        department: dto.department ?? null,
        photo_url: dto.photoUrl ?? null,
      })
      .select('*')
      .single()

    if (error || !data) throw new Error(error?.message ?? 'Error al crear los detalles')

    return this.format(data)
  }

  // ── Actualizar detalles ────────────────────────────────────────────────────

  async update(userId: string, dto: UpdateUserDetailsDto) {
    const updateData: Record<string, any> = {}

    if (dto.paternalLastName !== undefined) updateData.paternal_last_name = dto.paternalLastName
    if (dto.maternalLastName !== undefined) updateData.maternal_last_name = dto.maternalLastName
    if (dto.firstNames !== undefined) updateData.first_names = dto.firstNames
    if (dto.birthDate !== undefined) updateData.birth_date = dto.birthDate
    if (dto.cellphone !== undefined) updateData.cellphone = dto.cellphone
    if (dto.country !== undefined) updateData.country = dto.country
    if (dto.department !== undefined) updateData.department = dto.department
    if (dto.photoUrl !== undefined) updateData.photo_url = dto.photoUrl

    const { data, error } = await this.supabase.admin
      .from('user_details')
      .update(updateData)
      .eq('user_id', userId)
      .select('*')
      .single()

    if (error || !data) throw new NotFoundException('Detalles de usuario no encontrados')

    return this.format(data)
  }

  // ── Eliminar detalles (solo admin) ────────────────────────────────────────

  async remove(userId: string) {
    const { error } = await this.supabase.admin
      .from('user_details')
      .delete()
      .eq('user_id', userId)

    if (error) throw new NotFoundException('Detalles de usuario no encontrados')

    return { message: 'Detalles de usuario eliminados correctamente' }
  }

  // ── Helper ─────────────────────────────────────────────────────────────────

  private format(d: any) {
    return {
      id: d.id,
      userId: d.user_id,
      paternalLastName: d.paternal_last_name ?? null,
      maternalLastName: d.maternal_last_name ?? null,
      firstNames: d.first_names,
      birthDate: d.birth_date ?? null,
      cellphone: d.cellphone ?? null,
      country: d.country ?? null,
      department: d.department ?? null,
      photoUrl: d.photo_url ?? null,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }
  }
}
