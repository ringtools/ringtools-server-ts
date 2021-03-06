import {FastifyInstance, FastifyReply, FastifyRequest} from 'fastify';
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
 * Registers the root Socket.IO endpoints
 */
@Controller({
  route: '/',
})
export default class MainController {
  @Inject(FastifyInstanceToken)
  public instance!: FastifyInstance;

  @Inject(LndService)
  private readonly lndService!: LndService;

  /**
   * Register routes for frontend and redirect to index.html
   * @param request
   * @param reply
   */
  @GET('overview')
  @GET('visual')
  @GET('ring-only')
  @GET('settings')
  redirectToIndex(request: FastifyRequest<any>, reply: FastifyReply<any>) {
    reply.sendFile('index.html');
  }

  @Hook('onReady')
  registerWsHandlers() {
    this.instance.io.on(
      'connection',
      (socket: Socket<DefaultEventsMap, DefaultEventsMap>) => {
        socket.on('subscribe_channel', (data) => {
          for (const channelId of data.data) {
            socket.join(channelId);
          }
        });
        socket.on('subscribe_pubkey', (data) => {
          for (const pubKey of data.data) {
            socket.join(pubKey);
            this.lndService
              .getNode(pubKey)
              .then((nodeInfo) => {
                socket.emit('pubkey', nodeInfo);
              })
              .catch(() => {});
          }
        });
        socket.on('unsubscribe_pubkey', (data) => {
          for (const pubKey of data.data) {
            socket.leave(pubKey);
          }
        });
        socket.on('unsubscribe_all', (_data) => {
          for (const room of socket.rooms) {
            socket.leave(room);
          }
        });
      },
    );
  }
}
