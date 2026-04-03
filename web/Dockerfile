FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Next.js builds are heavy, so we do this during the run phase for dev
EXPOSE 3000
CMD ["npm", "run", "dev"]