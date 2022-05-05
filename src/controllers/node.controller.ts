import {FastifyRequest, FastifyReply, FastifyInstance} from 'fastify';
import {
  Controller,
  FastifyInstanceToken,
  GET,
  Hook,
  Inject,
} from 'fastify-decorators';
import {Socket} from 'socket.io';
import {DefaultEventsMap} from 'socket.io/dist/typed-events';

import {LndService} from '../services/lnd-service';

/**
 * Handles node information methods
 */
@Controller({route: '/node'})
export default class NodeController {
  @Inject(FastifyInstanceToken)
  public instance!: FastifyInstance;

  constructor(private readonly lndService: LndService) {
    lndService.nodeUpdateSubject.subscribe((data) => {
      for (const node of data) {
        lndService
          .getNode(node.identity_key)
          .then((nodeInfo) => {
            this.instance.io.to(nodeInfo.node.pub_key).emit('pubkey', nodeInfo);
            this.instance.io
              .of('/node')
              .to(nodeInfo.node.pub_key)
              .emit('node', nodeInfo);
          })
          .catch(() => {});
      }
    });
  }

  @GET({url: '/:pubKey'})
  async getNode(request: FastifyRequest<any>, reply: FastifyReply<any>) {
    if (request.params.pubKey.length !== 66) return reply.notFound();

    try {
      return await this.lndService.getNode(request.params.pubKey);
    } catch(e) {
      if (e.response && e.response.data.code === 5) {
        return reply.notFound();
      } else {
        let msg;
        if (e.errno && e.errno === -3008) {
          msg = "Backend can not be reached";
        }
        return reply.internalServerError(msg);
      }
    }
  }

  @Hook('onReady')
  registerWsHandlers() {
    const nodeNamespace = this.instance.io.of('/node');

    nodeNamespace.on(
      'connection',
      (socket: Socket<DefaultEventsMap, DefaultEventsMap>) => {
        socket.on('subscribe', (data) => {
          for (const pubKey of data) {
            socket.join(pubKey);
            this.lndService
              .getNode(pubKey)
              .then((nodeInfo) => {
                socket.emit('node', nodeInfo);
              })
              .catch(() => {});
          }
        });
      },
    );
  }
}
