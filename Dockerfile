# 1  ---------------  our "build" image can have all kinds of tools
FROM node:gallium-bullseye-slim AS build

# install sqlite and gdal-tools (for ogr2ogr to build our db)
RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends sqlite3 gdal-bin wget ca-certificates unzip

# start to build the app
WORKDIR /app

# install node dependencies
COPY package.json .
COPY yarn.lock .
RUN yarn --production

# wrangle our local sqlite db and import data
COPY scripts scripts
RUN yarn build

# 2 --------------- production image can be really trimmed down
FROM node:16.17.0-bullseye-slim

USER node
WORKDIR /app

# bring over the build products
COPY --chown=node:node --from=build /app/node_modules /app/node_modules
COPY --chown=node:node --from=build /app/incentives-api.db /app/incentives-api.db

# only copy the source folders we need
# (not using COPY . . because we don't want scripts)
# (not excluding scripts in .dockerignore because we need it in build)
COPY --chown=node:node ./package.json /app/package.json
COPY --chown=node:node ./app.js /app/app.js
COPY --chown=node:node ./lib /app/lib
COPY --chown=node:node ./locales /app/locales
COPY --chown=node:node ./plugins /app/plugins
COPY --chown=node:node ./routes /app/routes
COPY --chown=node:node ./schemas /app/schemas
COPY --chown=node:node ./data /app/data

# this is what Cloud Run needs:
ENV PORT 8080
ENV NODE_ENV production

# go!
CMD yarn start
