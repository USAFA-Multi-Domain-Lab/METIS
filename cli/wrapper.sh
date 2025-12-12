#!/bin/bash

# Bash wrapper for the common METIS CLI implementation
# All functionality is implemented in cli.js

# Get the directory where this script is located
CLI_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Execute the Node.js CLI script with all arguments
node "${CLI_DIR}/index.js" "$@"
