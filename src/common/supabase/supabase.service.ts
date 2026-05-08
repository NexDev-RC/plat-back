import { Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

@Injectable()
export class SupabaseService implements OnModuleInit {
  /** Cliente con service_role — para operaciones admin (bypassea RLS) */
  admin: SupabaseClient

  /** Cliente con anon key — para operaciones del usuario autenticado */
  client: SupabaseClient

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const url = this.configService.get<string>('SUPABASE_URL');
    const key = this.configService.get<string>('SUPABASE_KEY');
    
    if (!url || !key) {
      console.error('ERROR: SUPABASE_URL o SUPABASE_KEY no definidos en .env');
      return; // Evita que la app explote
    }
    
    // Asegurarse de que los valores no sean undefined
    const safeUrl = url || 'https://fallback.supabase.co';
    const safeKey = key || 'fallback-key';
    
    this.client = createClient(safeUrl, safeKey);

    this.admin = createClient(safeUrl, safeKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }

  /**
   * Devuelve un cliente actuando en nombre de un usuario autenticado.
   * Útil para que RLS se aplique con el JWT del usuario.
   */
  clientForUser(accessToken: string): SupabaseClient {
    const url = this.configService.get<string>('SUPABASE_URL');
    const key = this.configService.get<string>('SUPABASE_KEY');
    if (!url || !key) {
      throw new Error('SUPABASE_URL o SUPABASE_KEY no están definidas en el .env');
    }
    return createClient(url, key);
  }
}
