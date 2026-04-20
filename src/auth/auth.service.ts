import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { SupabaseService } from '../common/supabase/supabase.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import * as bcrypt from 'bcryptjs'

@Injectable()
export class AuthService {
  constructor(
    private supabase: SupabaseService,
    private jwt: JwtService,
  ) {}

  // ── Registro ───────────────────────────────────────────────────────────────

  async register(dto: RegisterDto) {
    // 1. Verificar que el email no exista
    const { data: existing } = await this.supabase.admin
      .from('users')
      .select('id')
      .eq('email', dto.email)
      .single()

    if (existing) {
      throw new ConflictException('Ya existe una cuenta con ese correo')
    }

    // 2. Hashear contraseña
    const passwordHash = await bcrypt.hash(dto.password, 12)

    // 3. Insertar usuario en la tabla users
    const { data: user, error } = await this.supabase.admin
      .from('users')
      .insert({
        name: dto.name,
        email: dto.email,
        password_hash: passwordHash,
        role: dto.role ?? 'student',
      })
      .select('id, name, email, role, avatar_url, created_at')
      .single()

    if (error) {
      throw new InternalServerErrorException('Error al crear el usuario')
    }

    const token = this.signToken(user.id, user.email, user.role)

    return {
      user: this.formatUser(user),
      access_token: token,
    }
  }

  // ── Login ──────────────────────────────────────────────────────────────────

  async login(dto: LoginDto) {
    // 1. Buscar usuario por email
    const { data: user, error } = await this.supabase.admin
      .from('users')
      .select('id, name, email, role, avatar_url, password_hash, created_at')
      .eq('email', dto.email)
      .single()

    if (error || !user) {
      throw new UnauthorizedException('Credenciales inválidas')
    }

    // 2. Verificar contraseña
    const passwordValid = await bcrypt.compare(dto.password, user.password_hash)
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas')
    }

    const token = this.signToken(user.id, user.email, user.role)

    return {
      user: this.formatUser(user),
      access_token: token,
    }
  }

  // ── Perfil del usuario autenticado ─────────────────────────────────────────

  async getMe(userId: string) {
    const { data: user, error } = await this.supabase.admin
      .from('users')
      .select('id, name, email, role, avatar_url, created_at')
      .eq('id', userId)
      .single()

    if (error || !user) {
      throw new UnauthorizedException('Usuario no encontrado')
    }

    return this.formatUser(user)
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private signToken(userId: string, email: string, role: string): string {
    return this.jwt.sign({ sub: userId, email, role })
  }

  private formatUser(user: any) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatar_url ?? null,
      createdAt: user.created_at,
    }
  }
}
