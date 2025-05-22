# Dockerfile

# 1. Base image
FROM node:node:18-slim

# 2. Set working directory
WORKDIR /app

# 3. Install dependencies
COPY package*.json ./
RUN npm install

# 4. Copy app files
COPY . .

# 5. Build app
RUN npm run build

# 6. Expose port and run
EXPOSE 3000
CMD ["npm", "start"]
