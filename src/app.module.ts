import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { CoursesModule } from './courses/courses.module'
import { CategoriesModule } from './categories/categories.module'
import { EnrollmentsModule } from './enrollments/enrollments.module'
import { InvoicesModule } from './invoices/invoices.module'
import { SupabaseModule } from './common/supabase/supabase.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // ← agrega esto
    }),

    ThrottlerModule.forRoot([
      { ttl: 60000, limit: 100 },
    ]),

    SupabaseModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    CategoriesModule,
    EnrollmentsModule,
    InvoicesModule,
  ],
})
export class AppModule {}