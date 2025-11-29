FROM node:22-bookworm-slim

# Install minimal dependencies with aggressive retry and ignore hash mismatches
RUN apt-get clean && rm -rf /var/lib/apt/lists/* && \
    (apt-get update --allow-releaseinfo-change 2>/dev/null || apt-get update)

# Install wget and ca-certificates with --allow-unauthenticated to bypass hash checks
# Retry up to 3 times if it fails
RUN for i in 1 2 3; do \
      apt-get install -y --no-install-recommends --allow-unauthenticated \
        wget ca-certificates \
        libgssapi-krb5-2 libkrb5-3 libcom-err2 libk5crypto3 libkrb5support0 && \
      rm -rf /var/lib/apt/lists/* && break || \
      (apt-get clean && rm -rf /var/lib/apt/lists/* && apt-get update); \
    done

# Install MongoDB Database Tools directly from MongoDB
RUN ARCH=$(uname -m) && \
    if [ "$ARCH" = "aarch64" ]; then MONGO_ARCH="arm64"; else MONGO_ARCH="x86_64"; fi && \
    wget "https://fastdl.mongodb.org/tools/db/mongodb-database-tools-ubuntu2204-${MONGO_ARCH}-100.10.0.tgz" -O /tmp/mongodb-tools.tgz && \
    tar -xzf /tmp/mongodb-tools.tgz -C /tmp && \
    mv /tmp/mongodb-database-tools-*/bin/* /usr/local/bin/ && \
    rm -rf /tmp/mongodb-tools.tgz /tmp/mongodb-database-tools-*

# Install jq
RUN wget -O /usr/local/bin/jq https://github.com/stedolan/jq/releases/download/jq-1.6/jq-linux64 && \
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

# Force container port to 8083.
RUN printf "\nPORT=8083" >> ./config/docker.env

# Install dependencies and build
RUN npm install && \
    npm run build

CMD ["npm", "start"]