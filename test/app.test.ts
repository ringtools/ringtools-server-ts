import {testBuild} from './helper';


describe('app tests', () => {
  const app = testBuild();

  test('requests the "/" route', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/',
    });
    expect(res.statusCode).toBe(404);
  });
});
