import { Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { WebSocketLikeConstructor } from '@supabase/realtime-js'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { WebSocket } from 'ws'

const realtimeTransport = WebSocket as unknown as WebSocketLikeConstructor

@Injectable()
export class SupabaseService implements OnModuleInit {
  admin!: SupabaseClient
  client!: SupabaseClient

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const url = this.config.getOrThrow<string>('SUPABASE_URL')
    const anonKey = this.config.getOrThrow<string>('SUPABASE_ANON_KEY')
    const serviceKey = this.config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY')

    this.client = createClient(url, anonKey, {
      realtime: { transport: realtimeTransport },
    })

    this.admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      realtime: { transport: realtimeTransport },
    })
  }

  clientForUser(accessToken: string): SupabaseClient {
    const url = this.config.getOrThrow<string>('SUPABASE_URL')
    const anonKey = this.config.getOrThrow<string>('SUPABASE_ANON_KEY')

    return createClient(url, anonKey, {
      realtime: { transport: realtimeTransport },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    })
  }
}
