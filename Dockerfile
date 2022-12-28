ARG VERSION="current"
FROM node:$VERSION-alpine

WORKDIR /app

RUN apk update && apk add sqlite

COPY package.json .
COPY yarn.lock .

RUN yarn --production

COPY . .

ENV PORT=8080

CMD npm start