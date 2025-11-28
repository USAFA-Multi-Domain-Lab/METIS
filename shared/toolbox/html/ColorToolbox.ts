/**
 * Utility class for the manipulation of colors.
 */
export class ColorToolbox {
  /**
   * Converts a hex color to an RGB object.
   * @param hex The hex color string.
   * @returns An object with r, g, b properties or null if invalid.
   */
  public static hexToRgb(
    hex: string,
  ): { r: number; g: number; b: number } | null {
    // Remove the hash at the start if it's there
    hex = hex.replace(/^#/, '')
    // Parse r, g, b values
    const bigint = parseInt(hex, 16)
    const r = (bigint >> 16) & 255
    const g = (bigint >> 8) & 255
    const b = bigint & 255
    // Return an object with r, g, b properties
    return {
      r: r,
      g: g,
      b: b,
    }
  }

  /**
   * Determines the font color based on the background color.
   * @param backgroundColor The background color in hex format.
   * @returns The font color in hex format.
   */
  public static determineFontColor(backgroundColor: string) {
    // Convert the background color to RGB format
    const rgb = ColorToolbox.hexToRgb(backgroundColor)
    if (!rgb) return '#000' // Default to black if conversion fails

    // Calculate the luminance
    const luminance = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b

    // Return white or black based on luminance
    return luminance > 186 ? '#000' : '#fff'
  }
}
