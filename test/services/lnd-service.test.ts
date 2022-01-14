import tap from 'tap';
import { LndService } from '../../src/services/lnd-service';

tap.test('LndService should instantiate', async (t: any) => {
  t.plan(1)
  const lndService = new LndService();

  t.type(lndService, LndService);
});
