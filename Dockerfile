FROM node:16-bullseye-slim

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json yarn.lock ./

RUN yarn install --production
RUN yarn global add ts-node

EXPOSE 3000

CMD ["node"]