FROM node:20-alpine

WORKDIR /app

# Install dependencies first for better layer caching
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Copy source
COPY tsconfig*.json ./
COPY src ./src
COPY db ./db

EXPOSE 4000

# Default to dev server; compose overrides env and runs migrations first
CMD ["npm", "run", "dev"]

