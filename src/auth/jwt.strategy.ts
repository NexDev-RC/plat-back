import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { SupabaseService } from '../common/supabase/supabase.service'

export interface JwtPayload {
  sub: string   // user id
  email: string
  role: string
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private supabase: SupabaseService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    })
  }

  async validate(payload: JwtPayload) {
    // Verificar que el usuario sigue existiendo en Supabase
    const { data, error } = await this.supabase.admin
      .from('users')
      .select('id, name, email, role, avatar_url, created_at')
      .eq('id', payload.sub)
      .single()

    if (error || !data) {
      throw new UnauthorizedException('Usuario no encontrado')
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      avatarUrl: data.avatar_url,
      createdAt: data.created_at,
    }
  }
}
