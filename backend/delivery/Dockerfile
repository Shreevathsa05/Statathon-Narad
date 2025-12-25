# Use Node.js 22 LTS base image
FROM node:22

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the app code
COPY . .

# Expose app port (customize this if needed)
EXPOSE 4000

# Start the app
CMD ["node", "src/index.js"]