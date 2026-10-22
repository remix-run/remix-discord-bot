FROM node:24.22.1-bookworm-slim AS dependencies

RUN corepack enable && corepack prepare pnpm@10.34.5 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

FROM node:24.22.1-bookworm-slim

ARG COMMIT_SHA

RUN corepack enable && corepack prepare pnpm@10.34.5 --activate
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV COMMIT_SHA=$COMMIT_SHA

COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml server.ts tsconfig.json ./
COPY app ./app
COPY scripts ./scripts

CMD ["pnpm", "start"]
