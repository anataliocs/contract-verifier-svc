import { Module } from '@nestjs/common';
import { VerifyService } from './verify/verify.service';
import { ConfigModule } from '@nestjs/config';
import { VerifyController } from './verify/verify.controller';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [VerifyController],
  providers: [VerifyService],
})
export class AppModule {}
