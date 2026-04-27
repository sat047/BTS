# Use official Node.js runtime as a parent image
FROM node:18-alpine

# Set working directory in container
WORKDIR /app/server

# Copy package.json and package-lock.json
COPY server/package*.json ./

# Install dependencies
RUN npm install --production

# Copy the server code
COPY server/ .

# Expose port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Run the application
CMD ["node", "index.js"]
