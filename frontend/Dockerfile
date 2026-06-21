# Community Bridge web frontend (development image).
# Runs the Vite dev server; source is bind-mounted in docker-compose for hot
# reload. Build a static production image (nginx) later.
FROM node:20-alpine

WORKDIR /app

# Install deps first so they cache independently of source changes.
COPY package*.json ./
RUN npm install

# Copy the rest of the source (overlaid by a bind mount in compose for dev).
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]
