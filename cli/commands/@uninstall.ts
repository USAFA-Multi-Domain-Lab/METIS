import fs from 'fs'
import { promptYesNo } from 'util/io'
import { ICONS } from '../util/assets'
import { getPathIfInstalled, verifyTargetEnvId } from '../util/pathing'
import { StandardCommand } from './StandardCommand'
import { PositionalArg } from './args/PositionalArg'

/**
 * Recursively deletes a directory and all its contents.
 * @param dirPath - The directory path to delete.
 */
function removeDirectory(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true })
  }
}

/**
 * Validates the uninstall which will be performed.
 * @param targetEnvId - The target environment ID to validate.
 * @returns The installation path of the target environment.
 * @throws Will throw an error if the uninstall should not proceed.
 */
function validateUninstallRequest(targetEnvId: string): string {
  // Validate target environment ID.
  verifyTargetEnvId(targetEnvId)

  // Check if target environment is installed.
  let installPath = getPathIfInstalled(targetEnvId)

  if (!installPath) {
    throw new Error(`Target environment '${targetEnvId}' is not installed.`)
  }

  // Prevent uninstalling the core METIS target environment.
  if (targetEnvId.toLowerCase() === 'metis') {
    throw new Error(`Cannot uninstall the core METIS target environment.`)
  }

  return installPath
}

/* -- COMMAND DEFINITION -- */

const arg_targetEnvId = new PositionalArg(
  'targetEnvId',
  'The target environment ID to uninstall.',
)

/**
 * Uninstalls the specified target environment by removing
 * its directory from integration/target-env.
 * @param targetEnvId - The target environment ID to uninstall.
 * @resolves Once uninstallation is complete and successful.
 * @rejects Due to any error during the uninstallation process.
 */
export const command_uninstall = new StandardCommand(
  'uninstall',
  'Uninstalls a currently installed target environment.',
  [arg_targetEnvId],
  async ({ targetEnvId }) => {
    // Validate the uninstall parameters before proceeding.
    let installPath = validateUninstallRequest(targetEnvId)

    // Confirm with user before deleting.
    console.log(`${ICONS.warning} This will permanently delete:`)
    console.log(`   ${installPath}`)
    console.log('')

    let confirmed = await promptYesNo(
      'Are you sure you want to uninstall this target environment?',
      false,
    )

    if (!confirmed) {
      console.log(`${ICONS.info} Uninstall cancelled.`)
      return
    }

    // Remove the target environment directory.
    console.log(`${ICONS.pencil} Removing ${targetEnvId}...`)
    removeDirectory(installPath)

    console.log(
      `${ICONS.success} "${targetEnvId}" was successfully uninstalled! Restart METIS with 'metis restart' for changes to go into effect.`,
    )
  },
  { shorten: true },
)
