FROM node:22-alpine

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .

ENV PORT=8765
EXPOSE 8765
CMD ["node", "server.js"]
