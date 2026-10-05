import type { TValidColor } from '@shared/colors'

/**
 * Colors text in Markdown handed to a `RichText`, such as a prompt
 * message, the same way the editor's color picker does.
 * @param text The text to color.
 * @param color One of the approved METIS colors.
 * @returns The colored text.
 * @example `**${color('WARNING', RED)}**`
 */
export const color = (text: string, color: TValidColor): string => {
  return `<span style="color: ${color}">${text}</span>`
}
