FROM mcr.microsoft.com/playwright:focal

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

EXPOSE 8080

CMD ["node", "index.js"]
