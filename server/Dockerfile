FROM node:24-alpine

WORKDIR /app

# Cài dependency trước để tận dụng cache khi chỉ sửa code
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production
EXPOSE 3000

USER node

CMD ["node", "src/index.js"]
