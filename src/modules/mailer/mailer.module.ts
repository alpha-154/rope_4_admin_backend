import { Global, Module } from '@nestjs/common';
import { BrevoMailerService } from './brevo-mailer.service';

@Global()
@Module({
  providers: [BrevoMailerService],
  exports: [BrevoMailerService],
})
export class MailerModule {}
