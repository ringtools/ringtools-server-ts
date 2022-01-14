import tap from 'tap';

import {testBuild} from '../../test/helper';

tap.test('Non-numeric channels should return 404', async (t: any) => {
  t.plan(1);

  const app = await testBuild(t);

  const response = await app.inject({
    url: '/channel/abcdefg',
    method: 'GET',
  });

  t.equal(response.statusCode, 404, 'returns a status code of 404');

  t.teardown(() => app.close());
});
