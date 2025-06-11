FROM mcr.microsoft.com/playwright:v1.43.1-jammy

WORKDIR /app
COPY . .
RUN npm install

# Встановлюємо всі браузери Playwright
RUN npx playwright install --with-deps

CMD ["node", "index.js"]
