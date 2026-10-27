# Dockerfile for Winamp YTM Backend (Optimized for 24/7 Free Hosting e.g. Hugging Face Spaces)
FROM node:20-alpine

WORKDIR /app

# Install dependencies from server
COPY server/package*.json ./
RUN npm install --production

# Copy server application code
COPY server/ ./

# Hugging Face Spaces and Cloud default port
ENV PORT=7860
EXPOSE 7860

CMD ["node", "server.js"]
