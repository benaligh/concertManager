# Development Dockerfile
FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps to avoid conflicts
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Expose port 4202
EXPOSE 4202

# Start development server
CMD ["npm", "start", "--", "--host", "0.0.0.0", "--port", "4202", "--poll", "2000"]
