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
<<<<<<< HEAD
=======

    // Módulos de dominio
    MailModule,
>>>>>>> e7af63f9867c71e3c0997f1fe127e10c92a3fcb1
    AuthModule,
    UsersModule,
    CoursesModule,
    CategoriesModule,
    EnrollmentsModule,
<<<<<<< HEAD
    InvoicesModule,
=======
    UserDetailsModule,
>>>>>>> e7af63f9867c71e3c0997f1fe127e10c92a3fcb1
  ],
})
export class AppModule {}