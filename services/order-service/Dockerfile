FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Create a non-root user
RUN addgroup -g 1001 nodeapp && \
    adduser -u 1001 -G nodeapp -s /bin/sh -D nodeapp && \
    chown -R nodeapp:nodeapp /usr/src/app

USER nodeapp

EXPOSE 8081
CMD [ "npm", "start" ]
