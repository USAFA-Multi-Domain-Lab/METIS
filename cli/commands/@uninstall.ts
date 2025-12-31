import fs from 'fs'
import readline from 'readline'
import { ICONS } from '../util/assets.js'
import { ENV_ID_REGEX, getInstallPath } from '../util/pathing.js'

/**
 * Prompts user for input with a yes/no question.
 * @param question - The question to ask.
 * @param defaultToYes - Whether the default answer is yes.
 * @returns True if user answered yes, false otherwise.
 */
function promptYesNo(
  question: string,
  defaultToYes: boolean = false,
): Promise<boolean> {
  let readlineInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    let suffix = defaultToYes ? '(Y/n)' : '(y/N)'
    readlineInterface.question(`${question} ${suffix}: `, (answer) => {
      readlineInterface.close()
      let normalized = answer.trim().toLowerCase()
      if (normalized === '') {
        resolve(defaultToYes)
      } else {
        resolve(normalized === 'y' || normalized === 'yes')
      }
    })
  })
}

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
 * @throws Will throw an error if the uninstall should not proceed.
 */
function validateUninstall(targetEnvId: string): void {
  // Validate target environment ID.
  if (!ENV_ID_REGEX.test(targetEnvId)) {
    throw new Error(
      `Invalid target environment ID '${targetEnvId}'.\n` +
        `A target-environment ID may only contain lowercase letters, numbers, and single hyphens (no consecutive hyphens), and must start and end with a letter or number.`,
    )
  }

  // Check if target environment is installed.
  const installPath = getInstallPath(targetEnvId)

  if (!fs.existsSync(installPath)) {
    throw new Error(`Target environment '${targetEnvId}' is not installed.`)
  }

  // Prevent uninstalling the core METIS target environment.
  if (targetEnvId.toLowerCase() === 'metis') {
    throw new Error(`Cannot uninstall the core METIS target environment.`)
  }
}

/**
 * Uninstalls the specified target environment by removing
 * its directory from integration/target-env.
 * @param targetEnvId - The target environment ID to uninstall.
 * @resolves Once uninstallation is complete and successful.
 * @rejects Due to any error during the uninstallation process.
 */
export async function uninstall(targetEnvId: string): Promise<void> {
  // Validate the uninstall parameters before proceeding.
  validateUninstall(targetEnvId)

  const installPath = getInstallPath(targetEnvId)

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
}
