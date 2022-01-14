import tap from 'tap';

import {testBuild} from './helper';

tap.test('requests the "/" route', async (t: any) => {
  const app = await testBuild(t);

  const response = await app.inject({
    method: 'GET',
    url: '/',
  });
  t.equal(response.statusCode, 200, 'returns a status code of 200');
});
