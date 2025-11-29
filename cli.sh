#!/bin/bash

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
