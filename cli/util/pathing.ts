import fs from 'fs'
import path from 'path'

/**
 * The root directory where Metis is installed.
 */
export const METIS_DIR = path.resolve(__dirname, '../../')

/**
 * A regex used to validate the name of a target-environment
 * folder name.
 */
export const ENV_ID_REGEX = /(?!^.*--.*$)^[a-z0-9][a-z0-9-]+[a-z0-9]$/

/**
 * Determines the installation path for a given target environment ID,
 * regardless of whether or not it is installed.
 * @param targetEnvId - The target environment ID.
 * @returns The installation path.
 */
export function getInstallPath(targetEnvId: string): string {
  return path.join(METIS_DIR, 'integration', 'target-env', targetEnvId)
}

/**
 * Gets the installation path if the target environment is installed.
 * @param targetEnvId The target environment ID to verify.
 * @returns The installation path, if installed. Otherwise, `null`.
 */
export function getPathIfInstalled(targetEnvId: string): string | null {
  // Check if target environment is installed.
  const installPath = getInstallPath(targetEnvId)

  if (!fs.existsSync(installPath)) {
    return null
  }

  return installPath
}

/**
 * Verifies that the target environment ID is valid.
 * @param targetEnvId The target environment ID to verify.
 * @throws if the target environment ID is invalid.
 */
export function verifyTargetEnvId(targetEnvId: string): void {
  if (!ENV_ID_REGEX.test(targetEnvId)) {
    throw new Error(
      `Invalid target environment ID '${targetEnvId}'.\n` +
        `A target-environment ID may only contain lowercase letters, numbers, and single hyphens (no consecutive hyphens), and must start and end with a letter or number.`,
    )
  }
}
