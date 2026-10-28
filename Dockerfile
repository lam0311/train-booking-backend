
FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src/ ./src/
COPY scripts/ ./scripts/
COPY documents/ ./documents/
COPY openapi.json ./openapi.json
COPY swagger.yaml ./swagger.yaml

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["npm", "start"]
