import { Controller, Get } from '@nestjs/common';
import { VerifyService } from './verify.service';

@Controller()
export class VerifyController {
  constructor(private readonly verifyService: VerifyService) {}

  @Get()
  getHello(): string {
    return null;
  }
}
