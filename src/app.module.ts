import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { CoursesModule } from './courses/courses.module'
import { CategoriesModule } from './categories/categories.module'
import { EnrollmentsModule } from './enrollments/enrollments.module'
import { SupabaseModule } from './common/supabase/supabase.module'

@Module({
  imports: [
    // Variables de entorno disponibles en toda la app
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting: máximo 100 requests por minuto por IP
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // Módulo compartido de Supabase
    SupabaseModule,

    // Módulos de dominio
    AuthModule,
    UsersModule,
    CoursesModule,
    CategoriesModule,
    EnrollmentsModule,
  ],
})
export class AppModule {}
