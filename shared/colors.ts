import { StringToolbox } from './toolbox/strings/StringToolbox'

/**
 * The color white.
 */
export const WHITE = '#ffffff'

/**
 * The color red.
 */
export const RED = '#fd6b72'

/**
 * The color orange.
 */
export const ORANGE = '#ff9c50'

/**
 * The color brown.
 */
export const BROWN = '#b79769'

/**
 * The color yellow.
 */
export const YELLOW = '#ffdb67'

/**
 * The color green.
 */
export const GREEN = '#7ed321'

/**
 * The color blue.
 */
export const BLUE = '#52b1ff'

/**
 * The color purple.
 */
export const PURPLE = '#bc6fec'

/**
 * The color magenta.
 */
export const MAGENTA = '#ff6dce'

/**
 * The approved METIS colors by name, for code that refers to a
 * color by its name, such as `color('WARNING', RED)`.
 */
export const COLORS_BY_NAME = {
  white: WHITE,
  red: RED,
  orange: ORANGE,
  brown: BROWN,
  yellow: YELLOW,
  green: GREEN,
  blue: BLUE,
  purple: PURPLE,
  magenta: MAGENTA,
} as const satisfies Record<string, string>

/**
 * The approved METIS colors offered when picking a color in rich
 * text.
 */
export const COLOR_OPTIONS: TValidColor[] = Object.values(COLORS_BY_NAME)

/**
 * Gets the display name for a color, such as for the label of a color
 * swatch, which shows nothing but the color itself.
 * @param color The color to name.
 * @returns The capitalized name of the color, or the color itself when
 * it is not one of the approved METIS colors.
 */
export function getColorName(color: string): string {
  let entries = Object.entries(COLORS_BY_NAME)
  let match = entries.find(([, value]) => value === color)
  if (!match) return color
  let [name] = match
  return StringToolbox.capitalize(name)
}

/* -- TYPES -- */

/**
 * The name of an approved METIS color.
 * @see {@link COLORS_BY_NAME}
 */
export type TColorName = keyof typeof COLORS_BY_NAME

/**
 * A valid color value from the approved METIS colors.
 */
export type TValidColor = (typeof COLORS_BY_NAME)[keyof typeof COLORS_BY_NAME]
