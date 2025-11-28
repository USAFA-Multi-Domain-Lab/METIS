export class VersionToolbox {
  /**
   * @param value The string to validate.
   * @returns Whether the string is a valid semantic version.
   */
  public static isValidVersion(version: string): boolean {
    // Regular expression to match semantic versioning (e.g., 1.0.0, 2.1.3, etc.)
    const semverRegex = /^\d+\.\d+\.\d+$/
    return semverRegex.test(version)
  }

  /**
   * Compares two semantic version strings.
   * @param versionA The first version string.
   * @param versionB The second version string.
   * @returns Whether versionA is later, earlier, or
   * equal to versionB.
   * @throws If either version is invalid.
   */
  public static compareVersions(
    versionA: string,
    versionB: string,
  ): TVersionComparisonResult {
    if (!this.isValidVersion(versionA) || !this.isValidVersion(versionB)) {
      throw new Error('Invalid version format. Expected format: x.y.z')
    }

    const [majorA, minorA, patchA] = versionA.split('.').map(Number)
    const [majorB, minorB, patchB] = versionB.split('.').map(Number)

    if (
      majorA > majorB ||
      (majorA === majorB && minorA > minorB) ||
      (majorA === majorB && minorA === minorB && patchA > patchB)
    ) {
      return 'later'
    } else if (
      majorA < majorB ||
      (majorA === majorB && minorA < minorB) ||
      (majorA === majorB && minorA === minorB && patchA < patchB)
    ) {
      return 'earlier'
    } else {
      return 'equal'
    }
  }

  /**
   * Checks if versionA is later than versionB.
   * @param versionA The first version string.
   * @param versionB The second version string.
   * @returns Whether versionA is later than versionB.
   */
  public static isLaterThan(versionA: string, versionB: string): boolean {
    return this.compareVersions(versionA, versionB) === 'later'
  }

  /**
   * Checks if versionA is earlier than versionB.
   * @param versionA The first version string.
   * @param versionB The second version string.
   * @returns Whether versionA is earlier than versionB.
   */
  public static isEarlierThan(versionA: string, versionB: string): boolean {
    return this.compareVersions(versionA, versionB) === 'earlier'
  }
}

/* -- TYPES -- */

/**
 * The result of comparing two semantic versions.
 * @option 'later' - versionA is later than versionB
 * @option 'earlier' - versionA is earlier than versionB
 * @option 'equal' - versionA is equal to versionB
 */
export type TVersionComparisonResult = 'later' | 'earlier' | 'equal'
