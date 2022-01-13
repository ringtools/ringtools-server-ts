import * as https from 'https';

import axios from 'axios';
import {Subject} from 'rxjs';
import WebSocket from 'ws';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

axios.defaults.httpsAgent = httpsAgent;

interface GraphUpdateResult {
  result: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    node_updates: [];
    // eslint-disable-next-line @typescript-eslint/naming-convention
    channel_updates: [];
    // eslint-disable-next-line @typescript-eslint/naming-convention
    closed_chans: [];
  };
}

export class LndService {
  ws: WebSocket;
  channelUpdateSubject: Subject<any> = new Subject();
  nodeUpdateSubject: Subject<any> = new Subject();
  closedChannelSubject: Subject<any> = new Subject();

  constructor(protected lndRestApiUrl: string, protected macaroon: string) {
    this.ws = new WebSocket(
      `wss://${this.lndRestApiUrl}/v1/graph/subscribe?method=GET`,
      {
        // Work-around for self-signed certificates.
        rejectUnauthorized: false,
        headers: {
          'Grpc-Metadata-Macaroon': this.macaroon,
        },
      },
    );
  }

  run() {
    this.ws.on('open', () => {
      this.ws.send('{}');
    });
    this.ws.on('error', (err: Error) => {
      console.log(`Error: ${err}`);
    });
    this.ws.on('ping', (event: Buffer) => {});
    this.ws.on('message', (event: WebSocket.RawData) => {
      const data: GraphUpdateResult = JSON.parse(event.toString());

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

  private doLndGet(endPoint: string) {
    return axios.get(`https://${this.lndRestApiUrl}/${endPoint}`, {
      responseType: 'json',

      headers: {
        'Grpc-Metadata-Macaroon': this.macaroon,
      },
    });
  }
}
