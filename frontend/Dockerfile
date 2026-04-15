FROM node:20-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Build the application (for production)
RUN npm run build || true

# Expose port
EXPOSE 3000

# Run the application
CMD ["npm", "start"]
