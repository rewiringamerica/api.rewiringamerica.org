ARG VERSION="current"
FROM node:$VERSION-alpine

WORKDIR /app

# install node dependencies
COPY package.json .
COPY yarn.lock .
RUN yarn --production

# install sqlite and build the database
RUN apk update && apk add sqlite
COPY data data
RUN yarn build

# make sure all deps end up in local file system
COPY . .

# go!
ENV PORT=8080
CMD yarn start