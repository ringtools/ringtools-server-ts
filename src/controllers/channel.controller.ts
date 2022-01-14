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
 * Handles channel information methods
 */
@Controller({route: '/channel'})
export default class ChannelController {
  @Inject(FastifyInstanceToken)
  public instance!: FastifyInstance;

  constructor(private readonly lndService: LndService) {
    lndService.channelUpdateSubject.subscribe((data) => {
      for (const channel of data) {
        lndService
          .getChannel(channel.chan_id)
          .then((chanInfo) => {
            this.instance.io
              .to([chanInfo.node1_pub, chanInfo.node2_pub, chanInfo.channel_id])
              .emit('channel', chanInfo);
            this.instance.io
              .of('/channel')
              .to(channel.chan_id)
              .emit('channel', chanInfo);
            this.instance.io
              .of('/node')
              .to([chanInfo.node1_pub, chanInfo.node2_pub])
              .emit('channel', chanInfo);
          })
          .catch(() => {});
      }
    });
  }

  @GET({url: '/:channelId'})
  async getChannel(
    request: FastifyRequest<{Params: {channelId: string}}>,
    reply: FastifyReply<any>,
  ) {
    if (isNaN(Number(request.params.channelId))) return reply.notFound();

    return this.lndService.getChannel(request.params.channelId);
  }

  @Hook('onReady')
  registerWsHandlers() {
    const channelNamespace = this.instance.io.of('/channel');

    channelNamespace.on(
      'connection',
      (socket: Socket<DefaultEventsMap, DefaultEventsMap>) => {
        socket.on('subscribe', (data) => {
          socket.join(data);
          this.lndService
            .getChannel(data)
            .then((nodeInfo) => {
              socket.emit('channel', nodeInfo);
            })
            .catch(() => {});
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
