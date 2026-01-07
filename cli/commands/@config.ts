import fs from 'fs'
import path from 'path'
import { promptYesNo } from 'util/io'
import { getPathIfInstalled, verifyTargetEnvId } from 'util/pathing'
import { ICONS } from '../util/assets'
import { PositionalArg } from './args/PositionalArg'
import { CommandGroup } from './CommandGroup'
import { StandardCommand } from './StandardCommand'

/* -- FUNCTIONS -- */

/**
 * Validates the config generation which will be performed.
 * @param targetEnvId - The target environment ID to validate.
 * @returns The installation path of the target environment.
 * @throws Will throw an error if the config generation should
 * not proceed.
 */
function validateConfigGenRequest(targetEnvId: string): string {
  // Validate target environment ID.
  verifyTargetEnvId(targetEnvId)

  // Check if target environment is installed.
  let installPath = getPathIfInstalled(targetEnvId)

  if (!installPath) {
    throw new Error(`Target environment '${targetEnvId}' is not installed.`)
  }

  return installPath
}

/* -- COMMAND DEFINITION -- */

/**
 * The target environment path provided as a positional argument
 * to the config-generate command.
 */
const arg_targetEnvId = new PositionalArg(
  'targetEnvId',
  'The target environment identifier.',
)

/**
 * Generates a configs.json file for the specified target environment.
 * @param targetEnvId - The target environment ID of the config to generate.
 * @resolves Once config generation is complete and successful.
 * @rejects Due to any error during the generation process.
 */
const command_config_generate = new StandardCommand(
  'generate',
  'Generates a configs.json file for a target environment.',
  [arg_targetEnvId],
  async function ({ targetEnvId }): Promise<void> {
    let targetEnvPath = validateConfigGenRequest(targetEnvId)
    let configFile = path.join(targetEnvPath, 'configs.json')

    // Check if configs.json already exists
    if (fs.existsSync(configFile)) {
      let overwrite = await promptYesNo(
        `${ICONS.warning}  configs.json already exists at ${configFile}. Overwrite?`,
        false,
      )
      if (!overwrite) {
        console.log(`${ICONS.info} Operation cancelled.`)
        return
      }
    }

    // Create initial configs.json with example structure
    console.log(`${ICONS.pencil} Creating configs.json at ${configFile}`)
    let configContent = [
      {
        _id: '',
        name: '',
        data: {},
      },
    ]
    fs.writeFileSync(
      configFile,
      JSON.stringify(configContent, null, 2) + '\n',
      'utf8',
    )

    // Set permissions (read/write for owner only) - Unix only
    if (process.platform !== 'win32') {
      try {
        fs.chmodSync(configFile, 0o600)
        console.log(`${ICONS.success} Set file permissions to 600 (rw-------)`)
      } catch (err) {
        let errorMessage = err instanceof Error ? err.message : String(err)
        console.log(
          `${ICONS.warning} Could not set file permissions: ${errorMessage}`,
        )
      }
    }

    // Prompt for .gitignore
    let addToGitignore = await promptYesNo(
      `${ICONS.lock} Add configs.json to .gitignore? This is recommended for sensitive data`,
      true,
    )

    if (addToGitignore) {
      let gitignoreFile = path.join(targetEnvPath, '.gitignore')

      // Create .gitignore if it doesn't exist
      if (!fs.existsSync(gitignoreFile)) {
        fs.writeFileSync(gitignoreFile, 'configs.json\n', 'utf8')
        console.log(
          `${ICONS.success} Created .gitignore and added configs.json`,
        )
      } else {
        // Check if configs.json is already in .gitignore
        let gitignoreContent = fs.readFileSync(gitignoreFile, 'utf8')
        let lines = gitignoreContent.split('\n')
        if (lines.includes('configs.json')) {
          console.log(`${ICONS.info}  configs.json already in .gitignore`)
        } else {
          fs.appendFileSync(gitignoreFile, 'configs.json\n', 'utf8')
          console.log(`${ICONS.success} Added configs.json to .gitignore`)
        }
      }
    } else {
      console.log(
        `${ICONS.warning}  Skipped .gitignore update. Remember to handle sensitive data appropriately.`,
      )
    }

    console.log('')
    console.log(`${ICONS.success} Configuration file created successfully!`)
    console.log(`${ICONS.file} Location: ${configFile}`)
    console.log(`${ICONS.steps} Next steps:`)
    console.log(`   1. Edit ${configFile} with your actual configuration data`)
    console.log(`   2. Ensure the file is readable by the METIS server process`)
    console.log(`   3. Restart the server to load the new configuration`)
  },
)

/**
 * Command group for managing target-env config files.
 */
export const command_config = new CommandGroup(
  'config',
  'Manages configuration files for target environments.',
  [command_config_generate],
)
