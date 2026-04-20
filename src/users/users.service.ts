import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common'
import { SupabaseService } from '../common/supabase/supabase.service'
import { UpdateUserDto, UpdateUserRoleDto } from './dto/update-user.dto'

@Injectable()
export class UsersService {
  constructor(private supabase: SupabaseService) {}

  // ── Listar todos los usuarios (solo admin) ─────────────────────────────────

  async findAll(page = 1, limit = 20) {
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await this.supabase.admin
      .from('users')
      .select('id, name, email, role, avatar_url, bio, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw new Error(error.message)

    return {
      data: data.map(this.formatUser),
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    }
  }

  // ── Buscar usuario por ID ──────────────────────────────────────────────────

  async findById(id: string) {
    const { data, error } = await this.supabase.admin
      .from('users')
      .select('id, name, email, role, avatar_url, bio, created_at')
      .eq('id', id)
      .single()

    if (error || !data) throw new NotFoundException('Usuario no encontrado')

    return this.formatUser(data)
  }

  // ── Actualizar perfil propio ───────────────────────────────────────────────

  async updateProfile(userId: string, dto: UpdateUserDto) {
    const updateData: Record<string, any> = {}
    if (dto.name) updateData.name = dto.name
    if (dto.avatarUrl !== undefined) updateData.avatar_url = dto.avatarUrl
    if (dto.bio !== undefined) updateData.bio = dto.bio

    const { data, error } = await this.supabase.admin
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('id, name, email, role, avatar_url, bio, created_at')
      .single()

    if (error || !data) throw new NotFoundException('Usuario no encontrado')

    return this.formatUser(data)
  }

  // ── Cambiar rol de usuario (solo admin) ───────────────────────────────────

  async updateRole(targetId: string, dto: UpdateUserRoleDto, adminId: string) {
    if (targetId === adminId) {
      throw new ForbiddenException('No puedes cambiar tu propio rol')
    }

    const { data, error } = await this.supabase.admin
      .from('users')
      .update({ role: dto.role })
      .eq('id', targetId)
      .select('id, name, email, role, created_at')
      .single()

    if (error || !data) throw new NotFoundException('Usuario no encontrado')

    return this.formatUser(data)
  }

  // ── Eliminar usuario (solo admin) ─────────────────────────────────────────

  async remove(targetId: string, adminId: string) {
    if (targetId === adminId) {
      throw new ForbiddenException('No puedes eliminarte a ti mismo')
    }

    const { error } = await this.supabase.admin
      .from('users')
      .delete()
      .eq('id', targetId)

    if (error) throw new NotFoundException('Usuario no encontrado')

    return { message: 'Usuario eliminado correctamente' }
  }

  // ── Helper ─────────────────────────────────────────────────────────────────

  private formatUser(u: any) {
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatarUrl: u.avatar_url ?? null,
      bio: u.bio ?? null,
      createdAt: u.created_at,
    }
  }
}
