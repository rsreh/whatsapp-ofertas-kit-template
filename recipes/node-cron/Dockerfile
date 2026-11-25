# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app

# Dependências (inclui devDeps: tsx/typescript são necessários em runtime)
COPY package.json package-lock.json ./
RUN npm ci

# Código
COPY . .

ENV NODE_ENV=production
EXPOSE 3000

# PORT pode ser injetado pelo provedor (Railway/Render/Fly)
CMD ["npm", "run", "start"]
