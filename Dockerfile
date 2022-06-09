FROM node:12.22.10-alpine as builder

# ARGS for node
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

WORKDIR /usr/src/app

# Install build dependencies
RUN apk add --no-cache make gcc g++ python2 hiredis ffmpeg

# Install npm dependencies
COPY package.json package-lock.* /usr/src/app/
RUN NODE_ENV=development npm i --ignore-scripts

# Build webpack
COPY src /usr/src/app/src
COPY webpack.config.js /usr/src/app/
RUN npm run build:dist && npm prune --production

EXPOSE $PORT
CMD [ "node", "src" ]
