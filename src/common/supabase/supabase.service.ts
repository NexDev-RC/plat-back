import { Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

@Injectable()
export class SupabaseService implements OnModuleInit {
  /** Cliente con service_role — para operaciones admin (bypassea RLS) */
  admin: SupabaseClient

  /** Cliente con anon key — para operaciones del usuario autenticado */
  client: SupabaseClient

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const url = this.config.getOrThrow<string>('SUPABASE_URL')
    const anonKey = this.config.getOrThrow<string>('SUPABASE_ANON_KEY')
    const serviceKey = this.config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY')

    this.client = createClient(url, anonKey)

    this.admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }

  /**
   * Devuelve un cliente actuando en nombre de un usuario autenticado.
   * Útil para que RLS se aplique con el JWT del usuario.
   */
  clientForUser(accessToken: string): SupabaseClient {
    const url = this.config.getOrThrow<string>('SUPABASE_URL')
    const anonKey = this.config.getOrThrow<string>('SUPABASE_ANON_KEY')
    return createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    })
  }
}
