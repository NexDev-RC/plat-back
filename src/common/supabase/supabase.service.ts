import { Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

@Injectable()
export class SupabaseService implements OnModuleInit {
admin!: SupabaseClient
client!: SupabaseClient

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

  clientForUser(accessToken: string): SupabaseClient {
    const url = this.config.getOrThrow<string>('SUPABASE_URL')
    const anonKey = this.config.getOrThrow<string>('SUPABASE_ANON_KEY')

    return createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    })
  }
}