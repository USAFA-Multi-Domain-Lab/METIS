#!/bin/bash

# Define constants
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

# Generates a configs.json file for a target environment
# with proper permissions and .gitignore handling.
config_generate() {
  local target_env_path="$1"
  
  # Validate target environment path
  if [[ -z "$target_env_path" ]]; then
    echo "❌ Error: Target environment path required."
    echo "Usage: ./cli.sh config generate <path-to-target-env>"
    echo "Example: ./cli.sh config generate integration/target-env/my-env"
    exit 1
  fi
  
  if [[ ! -d "$target_env_path" ]]; then
    echo "❌ Error: Target environment directory not found: $target_env_path"
    exit 1
  fi
  
  local config_file="${target_env_path}/configs.json"
  
  # Check if configs.json already exists
  if [[ -f "$config_file" ]]; then
    read -p "⚠️  configs.json already exists at $config_file. Overwrite? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo "❌ Operation cancelled."
      exit 0
    fi
  fi
  
  # Create initial configs.json with example structure
  echo "📝 Creating configs.json at $config_file"
  cat > "$config_file" << 'EOF'
[
  {
    "_id": "",
    "name": "",
    "data": {}
  }
]
EOF
  
  # Set permissions (read/write for owner only)
  chmod 600 "$config_file"
  echo "✅ Set file permissions to 600 (rw-------)"
  
  # Prompt for .gitignore
  read -p "🔒 Add configs.json to .gitignore? This is recommended for sensitive data (Y/n): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    local gitignore_file="${target_env_path}/.gitignore"
    
    # Create .gitignore if it doesn't exist
    if [[ ! -f "$gitignore_file" ]]; then
      echo "configs.json" > "$gitignore_file"
      echo "✅ Created .gitignore and added configs.json"
    else
      # Check if configs.json is already in .gitignore
      if grep -Fxq "configs.json" "$gitignore_file"; then
        echo "ℹ️  configs.json already in .gitignore"
      else
        echo "configs.json" >> "$gitignore_file"
        echo "✅ Added configs.json to .gitignore"
      fi
    fi
  else
    echo "⚠️  Skipped .gitignore update. Remember to handle sensitive data appropriately."
  fi
  
  echo ""
  echo "✅ Configuration file created successfully!"
  echo "📄 Location: $config_file"
  echo "📝 Next steps:"
  echo "   1. Edit $config_file with your actual configuration data"
  echo "   2. Ensure the file is readable by the METIS server process"
  echo "   3. Restart the server to load the new configuration"
}

# Systemctl shortcuts for metis.service
metis_cmd() {
  case "$1" in
    start)
      sudo systemctl start metis.service
      ;;
    stop)
      sudo systemctl stop metis.service
      ;;
    restart)
      sudo systemctl restart metis.service
      ;;
    status)
      sudo systemctl status metis.service
      ;;
    docker)
      shift
      # If the next arg is "up", then run the docker_up function.
      if [[ "$1" == "up" ]]; then
        docker_up
      # If the next arg is "down", then run the docker_down function.
      elif [[ "$1" == "down" ]]; then
        docker_down
      else
        echo "❌ Error: Unrecognized docker command '$1'."
      fi
      ;;
    config)
      shift
      # If the next arg is "generate", then run the config_generate function.
      if [[ "$1" == "generate" ]]; then
        shift
        config_generate "$@"
      else
        echo "❌ Error: Unrecognized config command '$1'."
        echo "Usage: ./cli.sh config generate <path-to-target-env>"
      fi
      ;;
    *)
      echo "❌ Error: Unrecognized command '$1'."
      echo "Usage: metis {start|stop|restart|status|docker up|docker down|config generate}"
      exit 1
      ;;
  esac
}

# Add whitespace to the console output.
echo " "

# Dispatch based on first argument
metis_cmd "$@"

# Add whitespace to the console output.
echo " "
