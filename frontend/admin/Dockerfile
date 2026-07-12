# Use official Node.js runtime as base image
FROM node:20-alpine

# Set working directory in container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm i

# Copy the rest of the application code
COPY . .

# Expose Vite default port
EXPOSE 5173

# Start the application in dev mode, exposing to all network interfaces
CMD ["npm", "run", "dev", "--", "--host"]
