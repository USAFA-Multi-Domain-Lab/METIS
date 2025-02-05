#!/bin/bash

# Define variables
CONFIG_FOLDER_NAME="config"
TEMPLATES_DIR="./deployment/docker/templates/"
DEPLOYMENT_OUTPUT_DIR="./deployment/docker/.out/"
DEFAULTS_ENV_FILE="${DEPLOYMENT_OUTPUT_DIR}${CONFIG_FOLDER_NAME}/docker.defaults.env"
ENV_FILE="${DEPLOYMENT_OUTPUT_DIR}${CONFIG_FOLDER_NAME}/docker.env"
DOCKER_COMPOSE_FILE="docker-compose.yml"
DOCKERFILE="Dockerfile"
DOCKER_COMPOSE_TEMPLATE="${TEMPLATES_DIR}${DOCKER_COMPOSE_FILE}"
DOCKERFILE_TEMPLATE="${TEMPLATES_DIR}${DOCKERFILE}"
DOCKER_COMPOSE_OUTPUT="${DEPLOYMENT_OUTPUT_DIR}${DOCKER_COMPOSE_FILE}"
DOCKERFILE_OUTPUT="${DEPLOYMENT_OUTPUT_DIR}${DOCKERFILE}"

# Load environment variables from the given
# file, exiting with an error if the file is
# not found.
load_env() {
  local file="$1"

  # Check if the file exists before loading
  if [[ -f "$file" ]]; then
      set -a  # Enable auto-export
      source "$file"
      set +a  # Disable auto-export
  else
      echo "❌ Error: $file file not found!"
      exit 1  # Exit with an error status
  fi

}

# Injects a value into the docker-compose.yml file
# using the given search and replace strings.
inject_in_compose() {
    local search="$1"
    local replace="$2"

    # macOS (BSD sed) requires -i '' while Linux (GNU sed) does not
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|${search}|${replace}|g" "$DOCKER_COMPOSE_OUTPUT"
    else
        sed -i "s|${search}|${replace}|g" "$DOCKER_COMPOSE_OUTPUT"
    fi
}

# Builds and runs the Docker containers.
docker_up() {
  # Create an output directory for deployment, deleting
  # the existing one if it exists.
  echo "Initializing deployment output directory."
  rm -rf ${DEPLOYMENT_OUTPUT_DIR}
  mkdir ${DEPLOYMENT_OUTPUT_DIR}

  # Copy templates into output directory.
  echo "Copying templates to deployment output directory."
  cp -r ${TEMPLATES_DIR} ${DEPLOYMENT_OUTPUT_DIR}

  # Copy config folder into output directory.
  echo "Copying config folder to deployment output directory."
  cp -r ${CONFIG_FOLDER_NAME} ${DEPLOYMENT_OUTPUT_DIR}

  # Load environment variables from the defaults file
  # and then from the user-defined file.
  echo "Loading environment variables."
  load_env "$DEFAULTS_ENV_FILE"
  load_env "$ENV_FILE"

  # Inject values into the docker-compose.yml file,
  # if MONGO_PORT is defined.
  if [[ -n "${MONGO_PORT}" ]]; then
    echo "Injecting values into docker-compose.yml."
    inject_in_compose "#\[DB_PORTS_LINE_1\]#" "ports:" 
    inject_in_compose "#\[DB_PORTS_LINE_2\]#" "  - ${MONGO_PORT}:27017"
  fi

  # Build and run the Docker containers.
  docker-compose -f ${DOCKER_COMPOSE_OUTPUT} --env-file ${DEFAULTS_ENV_FILE} --env-file ${ENV_FILE} up --build -d
}

# Tears down the Docker containers.
docker_down() {
  # Tear down the Docker containers.
  docker-compose -f ${DOCKER_COMPOSE_OUTPUT} --env-file ${DEFAULTS_ENV_FILE} --env-file ${ENV_FILE} down -v
}

# Add whitespace to the console output.
echo " "

# If the first arg is "docker", then process the 
# second arg.
if [[ "$1" == "docker" ]]; then
  # If the second arg is "up", then run the
  # docker_up function. 
  if [[ "$2" == "up" ]]; then
    docker_up
  # If the second arg is "down", then run the
  # docker_down function.
  elif [[ "$2" == "down" ]]; then
    docker_down
  else
    echo "❌ Error: Unrecognized command '$2'."
  fi
else
  echo "❌ Error: Unrecognized command '$1'."
fi

# Add whitespace to the console output.
echo " "
