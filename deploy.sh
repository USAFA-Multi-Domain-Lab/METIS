#!/bin/bash

# Define variables
TEMPLATES_DIR="./deployment/docker/templates/"
DEPLOYMENT_OUTPUT_DIR="./deployment/docker/.out/"
DOCKER_COMPOSE_FILE="docker-compose.yml"
DOCKERFILE="Dockerfile"
DOCKER_COMPOSE_TEMPLATE="${TEMPLATES_DIR}${DOCKER_COMPOSE_FILE}"
DOCKERFILE_TEMPLATE="${TEMPLATES_DIR}${DOCKERFILE}"
DOCKER_COMPOSE_OUTPUT="${DEPLOYMENT_OUTPUT_DIR}${DOCKER_COMPOSE_FILE}"
DOCKERFILE_OUTPUT="${DEPLOYMENT_OUTPUT_DIR}${DOCKERFILE}"


# Create an output directory for deployment, deleting
# the existing one if it exists.
echo "Initializing deployment output directory."
rm -rf ${DEPLOYMENT_OUTPUT_DIR}
mkdir ${DEPLOYMENT_OUTPUT_DIR}

# Copy templates into output directory.
echo "Copying templates to deployment output directory."
cp ${DOCKER_COMPOSE_TEMPLATE} ${DOCKERFILE_TEMPLATE} ${DEPLOYMENT_OUTPUT_DIR}

# # Inject MONGODB_PORTS data into docker-compose.yml.
# echo "Injecting MONGODB_PORTS data into docker-compose.yml."
# # Perform search and replace
# search="#[MONGODB_PORTS]#"
# # replace=$(printf 'ports:      - 27017:27017')
# replace="test"
# sed -i '' "s|${search}|${replace}|g" "${DOCKER_COMPOSE_OUTPUT}"

search="#\[DB_PORTS_LINE_1\]#"
replace="ports:"

# Run sed (compatible with macOS and Linux)
sed -i '' "s|${search}|${replace}|g" "${DOCKER_COMPOSE_OUTPUT}"
