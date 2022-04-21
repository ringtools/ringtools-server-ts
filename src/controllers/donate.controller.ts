import {FastifyInstance, FastifyReply, FastifyRequest} from 'fastify';
import {
  Controller,
  FastifyInstanceToken,
  GET,
  Hook,
  Inject,
  POST,
} from 'fastify-decorators';
import {Socket} from 'socket.io';
import {DefaultEventsMap} from 'socket.io/dist/typed-events';

import Donation from '../model/donation';
import {LndService} from '../services/lnd-service';

/**
 * Handles donation methods
 */
@Controller({route: '/donate'})
export default class DonateController {
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
          .catch(() => {
            console.log(`Error sending channel update for ${channel.chan_id}`);
          });
      }
    });
  }

  @POST({url: ''})
  async donate(
    request: FastifyRequest<{Body: Donation}>,
    reply: FastifyReply<any>,
  ) {
    if (isNaN(Number(request.body.sats))) return reply.notFound();

    let invoiceDescription = `RT`;
    if (request.body.message) {
      invoiceDescription += ` - ${request.body.message}`;
    }

    const expiry = 3600;

    try {
      const pr = await this.lndService.getInvoice(
        request.body.sats,
        invoiceDescription,
        expiry,
      );

      return {
        expiry,
        invoice: pr.payment_request,
      };
    } catch {
      return reply.notFound();
    }
  }
}
