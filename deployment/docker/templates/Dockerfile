FROM node:trixie-slim

# Install git, ssh client, and mongodb tools.
RUN apt-get update && \
    apt-get install -y git openssh-client wget gnupg && \
    wget -qO - https://www.mongodb.org/static/pgp/server-8.0.asc | apt-key add - && \
    echo "deb [ arch=amd64,arm64 ] http://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/8.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-8.0.list && \
    apt-get update && \
    apt-get install -y mongodb-database-tools && \
    rm -rf /var/lib/apt/lists/*

# Install jq
RUN curl -L -o /usr/local/bin/jq https://github.com/stedolan/jq/releases/download/jq-1.6/jq-linux64 && \
    chmod +x /usr/local/bin/jq


# Create app directory
WORKDIR /opt/metis

# Copy contents of the source directory into
# the new working directory.
COPY . .

# Create directories for persistent data
RUN mkdir -p ./files/store && \
    mkdir -p ./database/backups && \
    chmod -R 777 ./files/store && \
    chmod -R 777 ./database/backups

# Force MONGO_PORT to 27017, even
# if it is bound to a different port
# externally.
RUN printf "\nMONGO_PORT=27017" >> ./config/docker.env


# Install dependencies and build
RUN npm install && \
    npm run build

CMD ["npm", "run", "start"]