# Community Bridge API (development image).
# Runs the TypeScript entry directly via tsx; source is bind-mounted in
# docker-compose for hot reload. Build a slim production image later.
FROM node:20-alpine

WORKDIR /app

# Install deps first so they cache independently of source changes.
COPY package*.json ./
RUN npm install

# Copy the rest of the source (overlaid by a bind mount in compose for dev).
COPY . .

EXPOSE 4000

CMD ["npm", "run", "dev"]
