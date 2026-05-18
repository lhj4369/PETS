FROM node:20-bookworm-slim AS build
WORKDIR /app

ARG EXPO_PUBLIC_API_BASE_URL
ENV EXPO_PUBLIC_API_BASE_URL=${EXPO_PUBLIC_API_BASE_URL}
ENV EXPO_NO_TELEMETRY=1
ENV CI=1

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npx expo export -p web --output-dir dist

FROM nginx:1.27-alpine AS web
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80

