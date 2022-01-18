import {testBuild} from '../helper';

describe('main controller tests', () => {
  const app = testBuild();

  test('Main controller should do nothing', async () => {
    const response = await app.inject({
      url: '/',
      method: 'GET',
    });

    expect(response.statusCode).toBe(404);
  });
});
