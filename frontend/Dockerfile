# ── Stage 1: Build the React app ──────────────────────────────────────
# Start with Node.js to build the React app
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files first (for caching)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy all source code
COPY . .

# Set the backend URL for the build (can be overridden)
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

# Build the React app (creates /app/dist folder with static files)
RUN npm run build

# ── Stage 2: Serve with Nginx ─────────────────────────────────────────
# Start fresh with just Nginx (tiny image, ~20MB)
FROM nginx:alpine

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built React files from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx listens on port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]