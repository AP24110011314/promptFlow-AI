# Stage 1: Build React + Vite application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package configuration and install dependencies
COPY package*.json ./
RUN npm ci || npm install

# Copy source code and compile production bundle
COPY . .
RUN npm run build

# Stage 2: Serve compiled UI with Nginx reverse proxy
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built artifacts from Stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx proxy configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
