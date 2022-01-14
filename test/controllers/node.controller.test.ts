import tap from 'tap';

import {testBuild} from '../../test/helper';

tap.test('Too short pubkeys should return 404', async (t: any) => {
  t.plan(1);
  const app = await testBuild(t);
  const response = await app.inject({
    url: '/node/abcdefg',
    method: 'GET',
  });

  t.equal(response.statusCode, 404, 'returns a status code of 404');

  t.teardown(() => app.close());
});

tap.test('Too long pubkeys should return 404', async (t: any) => {
  t.plan(1);
  const app = await testBuild(t);
  const response = await app.inject({
    url: '/node/0380b3dbdf090cacee19eb4dc7a82630bd3de8b12608dd7bee971fb3cd2a5ae2fcd',
    method: 'GET',
  });

  t.equal(response.statusCode, 404, 'returns a status code of 404');

  t.teardown(() => app.close());
});

tap.test('Node URI should return 404', async (t: any) => {
  t.plan(1);
  const app = await testBuild(t);
  const response = await app.inject({
    url: '/node/0380b3dbdf090cacee19eb4dc7a82630bd3de8b12608dd7bee971fb3cd2a5ae2fc@[2a04:52c0:103:c1e3::1]:9735',
    method: 'GET',
  });

  t.equal(response.statusCode, 404, 'returns a status code of 404');

  t.teardown(() => app.close());
});
