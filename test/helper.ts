// This file contains code that we reuse between our tests.
import Fastify from 'fastify'
import fp from 'fastify-plugin'
import { build } from '../src/app'
import MockAdapter from "axios-mock-adapter";
import axios from "axios";

process.env['REJECT_UNAUTHORIZED'] = '0';
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
process.env['LND_REST_API_WS'] = 'ws://localhost:8080';

const edgeMockData = {"channel_id":"760383758935523329","chan_point":"0000000000000000000000000000000000000000000000000000000000000000:0","last_update":1642475331,"node1_pub":"0205a19356bbb7482057356aef070285a2ce6141d2448545210e9d575b57eddd37","node2_pub":"03d1b19ebc6cdce5685bad391f266d077f0cacd2e5c1f46824e1427ce7dba2f630","capacity":"0","node1_policy":{"time_lock_delta":42,"min_htlc":"1000","fee_base_msat":"1","fee_rate_milli_msat":"100","disabled":false,"max_htlc_msat":"990000000","last_update":1642475331},"node2_policy":{"time_lock_delta":40,"min_htlc":"1000","fee_base_msat":"0","fee_rate_milli_msat":"100","disabled":false,"max_htlc_msat":"990000000","last_update":1642460307}};

async function config () {
  return {}
}

let mock;

export function testBuild() {
  const app = Fastify();

  beforeAll(async () => {
    void app.register(fp(build), await config());
    await app.ready();
  });

  beforeEach(() => {
    mock = new MockAdapter(axios);
    mock.onAny(/^\/v1\/graph\/edge\/\d+/, edgeMockData);
  });
  
  afterEach(() => {
    if (mock)
      mock.reset();
  });

  afterAll(() => app.close());

  return app;
}

export { mock };