ARG VERSION="18.18.0"

# Separate build stage to compile TypeScript and build database
FROM node:$VERSION-alpine as builder
WORKDIR /app

# Install dependencies (including dev)
COPY package.json .
COPY tsconfig.json .
COPY yarn.lock .
RUN yarn

# Compile Typescript
COPY src src
RUN node_modules/.bin/tsc

# install sqlite & build database
RUN apk update && apk add sqlite
COPY scripts scripts
RUN yarn build


# Now the actual production image
FROM node:$VERSION-alpine
WORKDIR /app

# install node dependencies (without dev)
COPY package.json .
COPY yarn.lock .
RUN yarn --production

# Copy build products
COPY --from=builder /app/build build
COPY --from=builder /app/incentives-api.db .

# Copy static data
COPY data data
COPY locales locales

# go!
ENV PORT=8080
CMD yarn start
