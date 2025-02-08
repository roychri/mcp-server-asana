# Generated by https://smithery.ai. See: https://smithery.ai/docs/config#dockerfile
# Use a Node.js image to build the application
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json to the working directory
COPY package.json package-lock.json ./

# Install dependencies and build the application
RUN npm install --ignore-scripts && npm run build

# Copy the built application from the builder stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy only the necessary files from the builder stage
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json

# Set environment variables
ENV NODE_ENV=production

# The entry point to start the server
CMD ["node", "dist/index.js"]
