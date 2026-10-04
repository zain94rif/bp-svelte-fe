FROM docker.io/oven/bun:1.4-alpine AS build

WORKDIR /app
ENV PUBLIC_API_BASE_URL=http://localhost:8080
ENV PUBLIC_CAPTCHA_REQUIRED=true
ENV PUBLIC_CAPTCHA_MODE=internal
ENV PUBLIC_CAPTCHA_SITE_KEY=

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM docker.io/library/node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

EXPOSE 3000
CMD ["node", "build/index.js"]
