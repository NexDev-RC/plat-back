import { Module, Global } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { SupabaseService } from './supabase.service'

@Global()
@Module({
  imports: [ConfigModule], // Asegura que ConfigModule esté disponible para SupabaseService
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
