import * as mgrs from 'mgrs'

/**
 * Utility functions for working with Military Grid Reference System (MGRS) strings.
 */
export class MgrsToolbox {
  /**
   * Normalizes a user-provided MGRS string into a form that can be reliably parsed.
   * @param mgrsString The user-provided MGRS string.
   * @returns The normalized MGRS string.
   */
  public static normalize(mgrsString: string): string {
    let normalizedMgrsString = mgrsString.trim().toUpperCase()
    // Strip whitespace and common separators.
    normalizedMgrsString = normalizedMgrsString.replace(/[\s\-_/]+/g, '')
    // Keep only alphanumerics to be tolerant of punctuation.
    normalizedMgrsString = normalizedMgrsString.replace(/[^A-Z0-9]/g, '')
    return normalizedMgrsString
  }

  /**
   * Converts an MGRS coordinate string into latitude/longitude.
   * @param mgrsString The MGRS coordinate string.
   * @returns The latitude and longitude extracted from the MGRS string.
   * @throws If the MGRS string cannot be parsed.
   */
  public static toLatLong(mgrsString: string): TLatLon {
    let normalizedMgrsString = MgrsToolbox.normalize(mgrsString)

    try {
      let [longitude, latitude] = mgrs.toPoint(normalizedMgrsString)

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error('Parsed latitude/longitude were not finite numbers.')
      }

      return { latitude, longitude }
    } catch (error: any) {
      let errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(
        `Invalid MGRS coordinates "${mgrsString}". ` +
          `Expected a value like "38SMB1234567890" (spaces optional). ` +
          `Parser error: ${errorMessage}`,
      )
    }
  }
}

/**
 * A latitude/longitude pair.
 */
export type TLatLon = {
  latitude: number
  longitude: number
}
