import { Test, TestingModule } from '@nestjs/testing';
import { VerifyService } from './verify.service';
import { VerifyController } from './verify.controller';

describe('VerifyController', () => {
  let appController: VerifyController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [VerifyController],
      providers: [VerifyService],
    }).compile();

    appController = app.get<VerifyController>(VerifyController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBeNull();
    });
  });
});
