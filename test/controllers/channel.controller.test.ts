import {testBuild} from '../helper';

describe('channel controller tests', () => {
  const app = testBuild();

  test('Non-numeric channels should return 404', async () => {
    const response = await app.inject({
      url: '/channel/abcdefg',
      method: 'GET',
    });

    expect(response.statusCode).toEqual(404);
  });
});
