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
import { MailModule } from './mail/mail.module'
import { UserDetailsModule } from './user-details/user-details.module'
import { FacturasModule } from './facturas/facturas.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    ThrottlerModule.forRoot([
      { ttl: 60000, limit: 100 },
    ]),

    SupabaseModule,

    // Módulos de dominio
    MailModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    CategoriesModule,
    EnrollmentsModule,
    UserDetailsModule,
    FacturasModule,
    InvoicesModule,
  ],
})
export class AppModule {}