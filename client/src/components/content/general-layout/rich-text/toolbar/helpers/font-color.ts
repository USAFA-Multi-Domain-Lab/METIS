import { COLOR_OPTIONS } from '@shared/colors'
import { ColorToolbox } from '@shared/toolbox/html/ColorToolbox'
import type { Editor } from '@tiptap/react'

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

  if (activeColor && ColorToolbox.equals(activeColor, color)) {
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
    ? COLOR_OPTIONS.findIndex((color) =>
        ColorToolbox.equals(color, currentColor),
      )
    : -1

  if (currentIndex >= COLOR_OPTIONS.length - 1) {
    currentIndex = -1
  }

  editor.commands.setColor(COLOR_OPTIONS[currentIndex + 1])
}
