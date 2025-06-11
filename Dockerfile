FROM mcr.microsoft.com/playwright:v1.53.0-jammy

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

EXPOSE 8080

CMD ["node", "index.js"]
