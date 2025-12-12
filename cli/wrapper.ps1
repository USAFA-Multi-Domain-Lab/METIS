# PowerShell wrapper for the common METIS CLI implementation
# All functionality is implemented in cli.js

# Get the directory where this script is located
$cliDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Execute the Node.js CLI script with all arguments
node "$cliDir\index.js" $args