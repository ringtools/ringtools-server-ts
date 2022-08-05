import * as https from 'https';
import {existsSync, readFileSync} from 'fs';

import {SocksProxyAgent} from 'socks-proxy-agent';
import axios from 'axios';
import {Subject} from 'rxjs';
import WebSocket from 'ws';
import {Initializer, Service} from 'fastify-decorators';
import dotenv from 'dotenv';

dotenv.config();

let tlsCertData: string;
let macaroonData: string;
let rejectUnauthorized = true;

// Check if files exists, otherwise try to read base64 data
if (existsSync(process.env.MACAROON_FILE)) {
  macaroonData = readFileSync(process.env.MACAROON_FILE).toString('hex');
} else {
  macaroonData = process.env.MACAROON || '';
}

if (existsSync(process.env.TLS_CERT_FILE)) {
  tlsCertData = readFileSync(process.env.TLS_CERT_FILE).toString('ascii');
} else {
  tlsCertData = Buffer.from(
    process.env.TLS_CERT_BASE64 || '',
    'base64',
  ).toString('ascii');
}

if (tlsCertData === '' || macaroonData === '') {
  throw new Error(
    'TLS Certificate or Macaroon could not be loaded, this is required to run ringtools-ts-server',
  );
}

if (process.env.REJECT_UNAUTHORIZED) {
  rejectUnauthorized = Boolean(Number(process.env.REJECT_UNAUTHORIZED));
}

let httpsAgent;

if (process.env.USE_SOCKS_PROXY === '1') {
  httpsAgent = new SocksProxyAgent({
    host: process.env.SOCKS_PROXY_HOST || undefined,
    hostname: process.env.SOCKS_PROXY_HOST || undefined,
    port: process.env.SOCKS_PROXY_PORT || undefined,
    tls: {
      rejectUnauthorized: false,
      checkServerIdentity: () => undefined,
    },
  });
} else {
  httpsAgent = new https.Agent({
    rejectUnauthorized,
    ca: tlsCertData,
  });
}

axios.defaults.httpAgent = httpsAgent;
axios.defaults.httpsAgent = httpsAgent;

interface GraphUpdateResult {
  error?: {
    code: number;
    message?: string;
    details: any;
  };
  result?: {
    node_updates: [];
    channel_updates: [];
    closed_chans: [];
  };
}

let initalized = false

/**
 * Responsible for connecting to LND in several ways
 */
@Service()
export class LndService {
  ws!: WebSocket;
  channelUpdateSubject: Subject<any> = new Subject();
  nodeUpdateSubject: Subject<any> = new Subject();
  closedChannelSubject: Subject<any> = new Subject();
  lndRestApiWsUrl!: string;
  lndRestApiUrl!: string;

  macaroon!: string;

  constructor() {}

  @Initializer()
  init() {
    if (initalized)
      return

    initalized = true
    this.lndRestApiWsUrl = process.env.LND_REST_API_WS || 'ws://localhost:8080';
    this.lndRestApiUrl = process.env.LND_REST_API || 'http://localhost:8080';

    this.macaroon = macaroonData;
    this.ws = new WebSocket(
      `${this.lndRestApiWsUrl}/v1/graph/subscribe?method=GET`,
      {
        agent: httpsAgent,
        rejectUnauthorized,
        ca: tlsCertData,
        headers: {
          'Grpc-Metadata-Macaroon': this.macaroon,
        },
      },
    );

    this.run();
  }

  run() {
    this.ws.on('open', () => {
      this.ws.send('{}');
    });
    this.ws.on('error', (err: Error) => {
      console.log(err);
      console.log(`WS Error: ${err}`);
    });
    this.ws.on('ping', (_event: Buffer) => {});
    this.ws.on('message', (event: WebSocket.RawData) => {
      const data: GraphUpdateResult = JSON.parse(event.toString());
      if (data.error) {
        console.log(data.error);
        return;
      }

      if (data.result.node_updates.length) {
        this.nodeUpdateSubject.next(data.result.node_updates);
      }

      if (data.result.channel_updates.length) {
        this.channelUpdateSubject.next(data.result.channel_updates);
      }

      if (data.result.closed_chans.length) {
        this.closedChannelSubject.next(data.result.closed_chans);
      }
    });
  }

  async getNode(pubKey: string) {
    return (
      await this.doLndGet(`v1/graph/node/${pubKey}?include_channels=true`)
    ).data;
  }

  async getChannel(channelId: string) {
    return (await this.doLndGet(`v1/graph/edge/${channelId}`)).data;
  }

  public async getInvoice(
    value: number,
    memo: string,
    expiry = 3600,
  ) {
    const response = await this.doLndPost('v1/invoices', {
      value,
      memo,
      expiry,
    });

    return response.data;
  }

  private doLndGet(endPoint: string) {
    return axios.get(`${this.lndRestApiUrl}/${endPoint}`, {
      responseType: 'json',

      headers: {
        'Grpc-Metadata-Macaroon': this.macaroon,
      },
    });
  }

  private doLndPost(endPoint: string, data: any) {
    return axios.post(`${this.lndRestApiUrl}/${endPoint}`, data, {
      responseType: 'json',
      headers: {
        'Grpc-Metadata-Macaroon': this.macaroon,
      },
    });
  }
}
