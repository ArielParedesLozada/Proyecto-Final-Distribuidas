FROM node:20-alpine AS base

WORKDIR /app

COPY gateway/package*.json ./

RUN npm ci --omit=dev

COPY gateway/. .

COPY services/Protos ./Protos

EXPOSE 4000

CMD ["node", "src/app.js"]
