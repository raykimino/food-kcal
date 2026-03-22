FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build-only

EXPOSE 8080

CMD ["npx", "serve", "dist", "-l", "8080", "-p", "8080"]
