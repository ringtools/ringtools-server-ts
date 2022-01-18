import 'reflect-metadata';
import dotenv from 'dotenv';

import {build} from './app';

dotenv.config();

const server = build({
  logger: {
    level: 'warn',
    prettyPrint: true,
  },
});

server.listen(process.env.PORT || 7464, '::', (err, address) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
});

process.on('SIGINT', () => process.exit(1));
