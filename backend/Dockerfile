FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN chmod +x scripts/docker-entrypoint.sh
EXPOSE 4000
ENTRYPOINT ["/bin/sh", "scripts/docker-entrypoint.sh"]
