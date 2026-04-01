export class VersionToolbox {
  /**
   * @param value The string to validate.
   * @returns Whether the string is a valid semantic version.
   */
  public static isValidVersion(version: string): boolean {
    // Regular expression to match semantic versions in the form x.y.z.
    // Leading zeros are not allowed unless the segment is exactly "0".
    let semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/
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

  /**
   * Sorts an array of semantic version strings in ascending order.
   * @param versions The array of semantic version strings to sort.
   * @returns A new array sorted from earliest to latest.
   * @throws If any version in the array is invalid.
   */
  public static sortVersions(versions: string[]): string[] {
    return [...versions].sort((versionA, versionB) => {
      const result = this.compareVersions(versionA, versionB)
      if (result === 'later') return 1
      if (result === 'earlier') return -1
      return 0
    })
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
