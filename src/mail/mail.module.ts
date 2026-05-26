import { Module, Global } from '@nestjs/common'
import { MailService } from './mail.service'

@Global()  // Global para no importarlo en cada módulo
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
