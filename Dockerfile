FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm@10.7.1

# Disable Husky during Docker build
ENV SKIP_HUSKY=1
ENV NODE_ENV=production

# Install dependencies
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy source code and configuration files
COPY tsconfig.json ./
COPY src/ ./src/
COPY .prettierrc ./
COPY .prettierignore ./
COPY eslint.config.js ./
COPY .babelrc ./
COPY mcp.json ./

# Build TypeScript code
RUN pnpm run build

# Clean up dev dependencies and install production dependencies
RUN rm -rf node_modules && \
    pnpm install --frozen-lockfile --prod --ignore-scripts

# Set environment variables
ENV CODESCAN_URL=https://app.codescan.io
ENV NODE_OPTIONS="--experimental-specifier-resolution=node"

# Expose the port the app runs on
EXPOSE 3000

# Start the server
CMD ["node", "dist/index.js"] 