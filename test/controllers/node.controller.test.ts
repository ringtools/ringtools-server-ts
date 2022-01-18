import {mock, testBuild} from '../helper';

describe('node controller tests', () => {
  const app = testBuild();

  test('Too short pubkeys should return 404', (done) => {
    app
      .inject({
        url: '/node/abcdefg',
        method: 'GET',
      })
      .then((response) => {
        expect(response.statusCode).toBe(404);
        done();
      });
  });

  test('Too long pubkeys should return 404', (done) => {
    app
      .inject({
        url: '/node/0380b3dbdf090cacee19eb4dc7a82630bd3de8b12608dd7bee971fb3cd2a5ae2fcd',
        method: 'GET',
      })
      .then((response) => {
        expect(response.statusCode).toBe(404);
        done();
      });
  });

  test('Node URI should return 404', (done) => {
    app
      .inject({
        url: '/node/0380b3dbdf090cacee19eb4dc7a82630bd3de8b12608dd7bee971fb3cd2a5ae2fc@[2a04:52c0:103:c1e3::1]:9735',
        method: 'GET',
      })
      .then((response) => {
        expect(response.statusCode).toBe(404);
        done();
      });
  });

  test('Node URI should return 404', (done) => {
    app
      .inject({
        url: '/node/0380b3dbdf090cacee19eb4dc7a82630bd3de8b12608dd7bee971fb3cd2a5ae2fc@[2a04:52c0:103:c1e3::1]:9735',
        method: 'GET',
      })
      .then((response) => {
        expect(response.statusCode).toBe(404);
        done();
      });
  });


  // FIXME: Fix WebSocket mock
  // test('Valid Node URI should give nodeInfo', (done) => {
  //   mock.onGet(/^\/node\/\d+/).reply((config) => {
  //     console.log("Mock!",  config.url);
  //     return [200, {}]
  //   });
      

  //   app
  //     .inject({
  //       url: '/node/0205a19356bbb7482057356aef070285a2ce6141d2448545210e9d575b57eddd37',
  //       method: 'GET',
  //     })
  //     .then((response) => {
  //       expect(response.statusCode).toBe(200);
  //       done();
  //     });
  // });
});
