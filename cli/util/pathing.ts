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
 * Determines the installation path for a given target environment ID.
 * @param targetEnvId - The target environment ID.
 * @returns The installation path.
 */
export function getInstallPath(targetEnvId: string): string {
  return path.join(METIS_DIR, 'integration', 'target-env', targetEnvId)
}
