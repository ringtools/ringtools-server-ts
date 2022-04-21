import 'reflect-metadata';

import path, {resolve} from 'path/posix';

import dotenv from 'dotenv';
import fastify from 'fastify';
import socketioServer from 'fastify-socket.io';
import {bootstrap} from 'fastify-decorators';
import fastifySensible from 'fastify-sensible';
import fastifyHelmet from 'fastify-helmet';
import fastifyCors from 'fastify-cors';
import fastifyStatic from 'fastify-static';
import fastifyRateLimit from 'fastify-rate-limit';

dotenv.config();

const build = (opts = {}) => {
  const app = fastify(opts);

  app
    .register(fastifyRateLimit, {
      max: 100,
      allowList: ['127.0.0.1'],
      timeWindow: 5000,
    })
    .register(fastifyHelmet, {contentSecurityPolicy: false})
    .register(fastifyStatic, {
      root: path.join(__dirname, '../public'),
    })
    .register(fastifyCors)
    .register(socketioServer, {
      cors: {
        origin: true,
      },
    })
    .register(fastifySensible)
    .register(bootstrap, {
      directory: resolve(__dirname, 'controllers'),
      mask: /\.controller\./,
    });

  return app;
};

export {build};
