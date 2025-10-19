FROM node:18-alpine

WORKDIR /app

# Copiar package.json do backend
COPY backend/package*.json ./

RUN npm install --production

# Copiar código do backend
COPY backend/server.js ./

EXPOSE 3001

CMD ["node", "server.js"]
