# Use Node 22 (LTS) for 2026 compatibility
FROM node:22-alpine

WORKDIR /app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm install

# Copy the rest of the code
COPY . .

# Generate Prisma Client specifically for the Linux container
RUN npx prisma generate

# Build the NestJS app
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:dev"]