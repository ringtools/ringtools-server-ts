import { LndService } from '../../src/services/lnd-service';

describe('LndService tests', () => {
  test('LndService should instantiate', async () => {
    const lndService = new LndService();

    expect(lndService).toBeInstanceOf(LndService);
  });
});