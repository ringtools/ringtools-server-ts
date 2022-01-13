import dotenv from 'dotenv';
import fastify, {FastifyReply, FastifyRequest} from 'fastify';
import fastifyEnv from 'fastify-env';
import fastifySensible from 'fastify-sensible';
import socketioServer from 'fastify-socket.io';
import {Socket} from 'socket.io';
import {DefaultEventsMap} from 'socket.io/dist/typed-events';

import {LndService} from './lightning/lnd-service';

dotenv.config();

const lndService = new LndService(
  process.env.LND_REST_API || 'localhost:8080',
  process.env.MACAROON || '',
);

lndService.run();

const envSchema = {
  type: 'object',
  required: ['PORT'],
  properties: {
    PORT: {
      type: 'string',
      default: 3000,
    },
  },
};

const envOptions = {
  dotenv: true,
  schema: envSchema,
};

const server = fastify({
  logger: true,
});

server.register(socketioServer);
// server.register(helmet, {enableCSPNonces: true});
server.register(fastifyEnv, envOptions);
server.register(fastifySensible);

server.get(
  '/node/:pubKey',
  {
    schema: {
      querystring: {
        pubKey: {type: 'string'},
      },
    },
  },
  async (request: FastifyRequest<any>, reply: FastifyReply<any>) => {
    if (request.params.pubKey.length !== 66) reply.notFound();

    return lndService.getNode(request.params.pubKey);
  },
);

server.get(
  '/channel/:channelId',
  {
    schema: {
      querystring: {
        channelId: {type: 'integer'},
      },
    },
  },
  async (request: FastifyRequest<any>, reply: FastifyReply<any>) => {
    return lndService.getChannel(request.params.channelId);
  },
);

lndService.channelUpdateSubject.subscribe((data) => {
  for (const channel of data) {
    lndService
      .getChannel(channel.chan_id)
      .then((chanInfo) => {
        server.io
          .to([chanInfo.node1_pub, chanInfo.node2_pub, chanInfo.channel_id])
          .emit('channel', chanInfo);
        server.io.of('/channel').to(channel.chan_id).emit('channel', chanInfo);
        server.io
          .of('/node')
          .to([chanInfo.node1_pub, chanInfo.node2_pub])
          .emit('channel', chanInfo);
      })
      .catch(() => {});
  }
});

lndService.nodeUpdateSubject.subscribe((data) => {
  for (const node of data) {
    lndService
      .getNode(node.identity_key)
      .then((nodeInfo) => {
        server.io.to(nodeInfo.node.pub_key).emit('pubkey', nodeInfo);
        server.io.of('/node').to(nodeInfo.node.pub_key).emit('node', nodeInfo);
      })
      .catch(() => {});
  }
});

server.ready((err: Error) => {
  if (err) throw err;

  const nodeNamespace = server.io.of('/node');
  const channelNamespace = server.io.of('/channel');

  server.io.on(
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

          lndService
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

  channelNamespace.on(
    'connection',
    (socket: Socket<DefaultEventsMap, DefaultEventsMap>) => {
      socket.on('subscribe', (data) => {
        socket.join(data);

        lndService
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

  nodeNamespace.on(
    'connection',
    (socket: Socket<DefaultEventsMap, DefaultEventsMap>) => {
      socket.on('subscribe', (data) => {
        for (const pubKey of data) {
          socket.join(pubKey);

          lndService
            .getNode(pubKey)
            .then((nodeInfo) => {
              socket.emit('node', nodeInfo);
            })
            .catch(() => {});
        }
      });
    },
  );
});

server.listen(process.env.PORT || 3000, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
