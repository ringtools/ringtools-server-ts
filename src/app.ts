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

dotenv.config();

const build = (opts = {}) => {
  const app = fastify(opts);

  app
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
