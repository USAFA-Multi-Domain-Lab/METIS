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

  /**
   * Normalizes a CSS color string to `rgb(r, g, b)` format for cross-format
   * comparison. Browsers normalize `element.style.color` to RGB when parsing
   * HTML, so a color stored as `#fd6b72` on save becomes `rgb(253, 107, 114)`
   * on reload. Passing both sides through this function makes comparisons
   * format-agnostic.
   * @param color The color to normalize.
   * @returns The color in `rgb(r, g, b)` format.
   */
  public static normalizeColor(color: string): string {
    if (!color.startsWith('#') || color.length !== 7) return color
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    return `rgb(${r}, ${g}, ${b})`
  }

  /**
   * Checks whether two CSS color strings are the same color, even when one
   * is a six-digit hex color (`#rrggbb`) and the other its `rgb(r, g, b)`
   * form, such as a hex color saved by the editor and the `rgb()` form the
   * browser reports back for it. Any other format only matches when written
   * exactly the same.
   * @param a The first color.
   * @param b The second color.
   * @returns Whether the colors are the same.
   */
  public static equals(a: string, b: string): boolean {
    return ColorToolbox.normalizeColor(a) === ColorToolbox.normalizeColor(b)
  }
}
