import type { Level } from '@tiptap/extension-heading'
import type { Editor } from '@tiptap/react'

/**
 * The heading levels, in the order the shortcut steps through them.
 */
export const HEADING_LEVELS: Level[] = [1, 2, 3, 4, 5, 6]

/**
 * Steps to the next heading level for the current selection. When it
 * reaches the end it will go back to the first option in the list.
 * @param editor The editor to change.
 */
export const cycleHeadingLevel = (editor: Editor): void => {
  const activeLevel = HEADING_LEVELS.find((level) =>
    editor.isActive('heading', { level }),
  )
  const currentIndex =
    activeLevel !== undefined ? HEADING_LEVELS.indexOf(activeLevel) : -1

  const nextIndex =
    currentIndex >= HEADING_LEVELS.length - 1 ? 0 : currentIndex + 1

  editor.commands.toggleHeading({ level: HEADING_LEVELS[nextIndex] })
}
