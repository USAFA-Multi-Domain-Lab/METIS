import type { Editor } from '@tiptap/react'

/**
 * The line height options, in the order the shortcut steps through them.
 */
export const LINE_HEIGHT_OPTIONS = ['1', '1.5', '2', '2.5', '3']

/**
 * The line spacing on the text at the cursor, or undefined when it has none.
 * @param editor The editor to read.
 * @returns The active line height.
 */
export const getActiveLineHeight = (editor: Editor): string | undefined =>
  editor.getAttributes('textStyle').lineHeight

/**
 * Whether the text at the cursor has a line spacing on it, which is what makes
 * the toolbar's line spacing button read as active.
 * @param editor The editor to read.
 * @returns `True` when a line spacing is in force at the cursor.
 */
export const isLineSpacingActive = (editor: Editor): boolean =>
  LINE_HEIGHT_OPTIONS.some((spacing) =>
    editor.isActive('textStyle', { lineHeight: spacing }),
  )

/**
 * Selects/Deselects a line spacing for the current selection.
 * @param editor The editor to change.
 * @param lineHeight The line height to apply.
 */
export const toggleLineSpacing = (editor: Editor, lineHeight: string): void => {
  if (getActiveLineHeight(editor) === lineHeight) {
    editor.commands.unsetLineHeight()
  } else {
    editor.commands.setLineHeight(lineHeight)
  }
}

/**
 * Steps to the next line spacing for the current selection. When it
 * reaches the end it will go back to the first option in the list.
 * @param editor The editor to change.
 */
export const cycleLineSpacing = (editor: Editor): void => {
  const currentLineHeight = getActiveLineHeight(editor)

  let currentIndex = currentLineHeight
    ? LINE_HEIGHT_OPTIONS.indexOf(currentLineHeight)
    : -1

  if (currentIndex >= LINE_HEIGHT_OPTIONS.length - 1) {
    currentIndex = -1
  }

  editor.commands.setLineHeight(LINE_HEIGHT_OPTIONS[currentIndex + 1])
}
