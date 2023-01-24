ARG VERSION="16.19.0"
FROM node:$VERSION-alpine

WORKDIR /app

# install sqlite and build the database
RUN apk update && apk add sqlite libspatialite gdal
ENV SPATIALITE_EXTENSION_PATH=/usr/lib/mod_spatialite.so.7.1.0

# install node dependencies
COPY package.json .
COPY yarn.lock .
RUN yarn --production

# wrangle our local sqlite db
COPY data data
COPY scripts scripts
RUN yarn build

# make sure all deps end up in local file system
COPY . .

# go!
ENV PORT=8080
CMD yarn start