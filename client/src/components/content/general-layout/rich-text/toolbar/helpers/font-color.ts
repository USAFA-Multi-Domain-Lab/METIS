import { Mission } from '@shared/missions/Mission'
import type { Editor } from '@tiptap/react'

/**
 * The display names for the approved METIS colors. A swatch shows nothing but
 * its color, so these names are what the tooltip and the button label use.
 */
const COLOR_NAMES: Record<string, string> = {
  [Mission.WHITE]: 'White',
  [Mission.RED]: 'Red',
  [Mission.ORANGE]: 'Orange',
  [Mission.BROWN]: 'Brown',
  [Mission.YELLOW]: 'Yellow',
  [Mission.GREEN]: 'Green',
  [Mission.BLUE]: 'Blue',
  [Mission.PURPLE]: 'Purple',
  [Mission.MAGENTA]: 'Magenta',
}

/**
 * Gets the display name for a color, falling back to the color itself when it
 * is not one of the named METIS colors.
 * @param color The color to name.
 * @returns The name shown for the color.
 */
export const getColorName = (color: string): string =>
  COLOR_NAMES[color] ?? color

/**
 * Normalizes a CSS color string to `rgb(r, g, b)` format for cross-format
 * comparison. Browsers normalize `element.style.color` to RGB when parsing
 * HTML, so a color stored as `#fd6b72` on save becomes `rgb(253, 107, 114)`
 * on reload. Passing both sides through this function makes comparisons
 * format-agnostic.
 * @param color The color to normalize.
 * @returns The color in `rgb(r, g, b)` format.
 */
export const normalizeColor = (color: string): string => {
  if (!color.startsWith('#') || color.length !== 7) return color
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)
  return `rgb(${r}, ${g}, ${b})`
}

/**
 * The color on the text at the cursor, or undefined when it has none.
 * @param editor The editor to read.
 * @returns The active color.
 */
export const getActiveFontColor = (editor: Editor): string | undefined =>
  editor.getAttributes('textStyle').color

/**
 * Whether the text at the cursor has a color on it, which is what makes the
 * toolbar's color button read as active.
 * @param editor The editor to read.
 * @returns `True` when the text at the cursor is colored.
 */
export const isFontColorActive = (editor: Editor): boolean =>
  !!getActiveFontColor(editor)

/**
 * Applies a color to the current selection, or takes it back off when that
 * color is the one already there.
 * @param editor The editor to change.
 * @param color The color to apply.
 */
export const toggleFontColor = (editor: Editor, color: string): void => {
  const activeColor = getActiveFontColor(editor)

  if (activeColor && normalizeColor(activeColor) === normalizeColor(color)) {
    editor.commands.unsetColor()
  } else {
    editor.commands.setColor(color)
  }
}

/**
 * Steps to the next approved font color for the current selection. When it
 * reaches the end it will go back to the first option in the list.
 * @param editor The editor to change.
 */
export const cycleFontColor = (editor: Editor): void => {
  const currentColor = getActiveFontColor(editor)

  let currentIndex = currentColor
    ? Mission.COLOR_OPTIONS.findIndex(
        (color) => normalizeColor(color) === normalizeColor(currentColor),
      )
    : -1

  if (currentIndex >= Mission.COLOR_OPTIONS.length - 1) {
    currentIndex = -1
  }

  editor.commands.setColor(Mission.COLOR_OPTIONS[currentIndex + 1])
}
