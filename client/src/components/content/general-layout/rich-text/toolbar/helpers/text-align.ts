import type { Editor } from '@tiptap/react'

/**
 * The alignment options, in the order the shortcut steps through them.
 */
export const ALIGN_OPTIONS: TAlignOption[] = [
  {
    value: 'left',
    icon: 'align-left',
    label: 'Align Left',
    mac: '`cmd+shift+l`',
    windows: '`ctrl+shift+l`',
  },
  {
    value: 'center',
    icon: 'align-center',
    label: 'Align Center',
    mac: '`cmd+shift+e`',
    windows: '`ctrl+shift+e`',
  },
  {
    value: 'right',
    icon: 'align-right',
    label: 'Align Right',
    mac: '`cmd+shift+r`',
    windows: '`ctrl+shift+r`',
  },
  {
    value: 'justify',
    icon: 'align-justify',
    label: 'Justify',
    mac: '`cmd+shift+j`',
    windows: '`ctrl+shift+j`',
  },
]

/**
 * Whether the text at the cursor is aligned, which is what makes the toolbar's
 * alignment button read as active.
 * @param editor The editor to read.
 * @returns `True` when an alignment is in force at the cursor.
 */
export const isTextAlignActive = (editor: Editor): boolean =>
  ALIGN_OPTIONS.some((option) => editor.isActive({ textAlign: option.value }))

/**
 * Steps to the next alignment for the current selection. When it
 * reaches the end it will go back to the first option in the list.
 * @param editor The editor to change.
 */
export const cycleTextAlign = (editor: Editor): void => {
  const currentAlign = ALIGN_OPTIONS.find((option) =>
    editor.isActive({ textAlign: option.value }),
  )
  const currentIndex = currentAlign ? ALIGN_OPTIONS.indexOf(currentAlign) : -1

  const nextIndex =
    currentIndex >= ALIGN_OPTIONS.length - 1 ? 0 : currentIndex + 1

  editor.commands.setTextAlign(ALIGN_OPTIONS[nextIndex].value)
}

/* -- TYPES -- */

/**
 * An alignment option offered by the toolbar.
 */
export type TAlignOption = {
  /**
   * The alignment value.
   */
  value: string
  /**
   * The icon for the alignment option.
   */
  icon: TMetisIcon
  /**
   * The label for the alignment option.
   */
  label: string
  /**
   * The keyboard shortcut for macOS.
   */
  mac: string
  /**
   * The keyboard shortcut for Windows.
   */
  windows: string
}
