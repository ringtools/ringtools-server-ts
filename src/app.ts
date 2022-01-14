import 'reflect-metadata';

import {resolve} from 'path/posix';

import dotenv from 'dotenv';
import fastify from 'fastify';
import socketioServer from 'fastify-socket.io';
import {bootstrap} from 'fastify-decorators';
import fastifySensible from 'fastify-sensible';
import fastifyHelmet from 'fastify-helmet';

dotenv.config();

const build = (opts = {}) => {
  const app = fastify(opts);

  app
    .register(fastifyHelmet, {contentSecurityPolicy: false})
    .register(socketioServer)
    .register(fastifySensible)
    .register(bootstrap, {
      directory: resolve(__dirname, 'controllers'),
      mask: /\.controller\./,
    });

  return app;
};

export {build};
