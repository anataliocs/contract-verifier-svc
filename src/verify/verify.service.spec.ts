import { Test, TestingModule } from '@nestjs/testing';
import { AccountOperation, VerifyService } from './verify.service';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';

const moduleMocker = new ModuleMocker(global);

describe('VerifyService', () => {
  let service: VerifyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VerifyService],
    })
      .useMocker((token) => {
        const results = Promise.any('');
        if (token === VerifyService) {
          return { getTransactionsByPk: jest.fn().mockResolvedValue(results) };
        }
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(
            token,
          ) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    service = module.get<VerifyService>(VerifyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('result should be populated', async () => {
    const result = await service.getTransactions(
      'GB36JBIORI4AQ67ECFFMCGH5VXSJWOZYZZZXRHNOVECT5KA4WQYWB57F',
    );

    expect(service).toBeDefined();
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);

    const firstResultTx: AccountOperation = <AccountOperation>result.pop();
    expect(firstResultTx).toBeDefined();
    expect(firstResultTx.id).toBeDefined();
    expect(firstResultTx.tx.result.feeCharged()).toBeGreaterThan(0);
  });
});
