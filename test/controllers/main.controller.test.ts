import tap from 'tap';

import {testBuild} from '../../test/helper';

tap.test('Main controller should do nothing', async (t: any) => {
  t.plan(1);

  const app = await testBuild(t);

  const response = await app.inject({
    url: '/',
    method: 'GET',
  });

  t.equal(response.statusCode, 404, 'returns a status code of 404');

  t.teardown(() => app.close());
});
