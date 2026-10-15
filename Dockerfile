FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY server ./server
COPY www ./www
ENV NODE_ENV=production PORT=3000 DB_FILE=/data/mediinfo.db
RUN mkdir -p /data && chown -R node:node /data /app
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:3000/healthz || exit 1
CMD ["node","--disable-warning=ExperimentalWarning","server/server.js"]
