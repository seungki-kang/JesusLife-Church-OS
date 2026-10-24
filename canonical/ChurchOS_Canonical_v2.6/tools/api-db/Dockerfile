FROM node:24-bookworm-slim
WORKDIR /workspace/services/church-core
COPY services/church-core/package.json services/church-core/package-lock.json ./
RUN npm ci
COPY services/church-core/ ./
COPY db/ /workspace/db/
COPY tools/api-db/run.mjs /workspace/tools/api-db/run.mjs
RUN npm run build
ENTRYPOINT ["node", "/workspace/tools/api-db/run.mjs"]
