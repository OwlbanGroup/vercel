# --- Stage 1: Build the application ---
FROM node:22-alpine AS builder

# Set the working directory
WORKDIR /usr/src/app

# Install pnpm package manager
RUN npm install -g pnpm

# Copy dependency-related files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including dev dependencies needed for the build)
# Using `pnpm install` which is suitable for monorepos
RUN pnpm install

# Copy the rest of the application source code
COPY . .

# Build the application using the script from your package.json
# This will compile TypeScript to JavaScript in the /dist folder
RUN pnpm run build

# Remove development dependencies to shrink the node_modules folder
RUN pnpm prune --prod


# --- Stage 2: Create the final production image ---
FROM node:22-alpine AS production

# Set the working directory
WORKDIR /usr/src/app

# Copy the pruned production dependencies from the builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Copy the compiled application code from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Copy package.json, which might be needed by some libraries at runtime
COPY --from=builder /usr/src/app/package.json ./package.json

# Expose the port the application will run on (default is 3000 from your index.ts)
EXPOSE 3000

# The command to start the application
CMD ["node", "dist/index.js"]