import type { Editor } from '@tiptap/react'
import { cycleFontColor } from '../helpers/font-color'
import { cycleHeadingLevel } from '../helpers/heading'
import { cycleLineSpacing } from '../helpers/line-spacing'
import { cycleTextAlign } from '../helpers/text-align'
import type { TRichTextPickerKey } from '../RichTextToolbar'
import { useRichTextLinkPrompt } from './useRichTextLinkPrompt'
import type { TRichTextToolbarControls } from './useRichTextToolbar'

/**
 * The formats a shortcut can step through, keyed by the letter pressed
 * alongside Cmd/Ctrl+Shift.
 */
const FORMAT_CYCLE_SHORTCUTS: Record<string, TFormatCycleShortcut> = {
  c: { picker: 'color', cycle: cycleFontColor },
  h: { picker: 'heading', cycle: cycleHeadingLevel },
  a: { picker: 'align', cycle: cycleTextAlign },
  p: { picker: 'line-spacing', cycle: cycleLineSpacing },
}

/**
 * Every keyboard shortcut the editor and its toolbar answer to.
 * @returns The handler to attach to the editor's DOM element.
 */
export function useRichTextKeyboardShortcuts({
  editor,
  toolbar,
}: TRichTextKeyboardShortcuts_P): (event: KeyboardEvent) => void {
  const toggleLink = useRichTextLinkPrompt()

  return (event: KeyboardEvent) => {
    const modified = event.metaKey || event.ctrlKey
    // Windows reports the shifted character for a letter key while macOS
    // reports the unshifted one, so letters are compared in lower case.
    const pressedLetter = event.key.toLowerCase()

    // Escape — puts away an open picker, then the toolbar itself.
    if (event.key === 'Escape') {
      event.preventDefault()
      toolbar.dismiss()
    }

    // Cmd/Ctrl+K — toggle link.
    if (modified && !event.shiftKey && pressedLetter === 'k') {
      event.preventDefault()
      toggleLink(editor)
    }

    // Cmd+Opt+0 / Ctrl+Alt+0 — clear all formatting.
    if (modified && event.altKey && pressedZero(event)) {
      event.preventDefault()
      editor.commands.unsetAllMarks()
      editor.commands.clearNodes()
    }

    // Cmd/Ctrl+Shift+M — show/hide the toolbar at the cursor's location.
    if (modified && event.shiftKey && pressedLetter === 'm') {
      event.preventDefault()
      toolbar.togglePinned()
    }

    // Cmd/Ctrl+Shift +C / +H / +A / +P - step a format forward one option.
    const formatShortcut = FORMAT_CYCLE_SHORTCUTS[pressedLetter]
    if (modified && event.shiftKey && formatShortcut) {
      event.preventDefault()
      const { picker, cycle } = formatShortcut
      toolbar.showPicker(picker)
      cycle(editor)
    }
  }
}

/**
 * Whether the key pressed was a zero.
 * @param event The key that was pressed.
 * @returns `True` when the key was a zero.
 * @note The zero key is matched both by its position on the keyboard and by every
 * character it can produce, because holding a modifier can turn it into a
 * different character and the number pad reports itself as a separate key.
 */
const pressedZero = (event: KeyboardEvent): boolean =>
  event.code === 'Digit0' ||
  event.code === 'Numpad0' ||
  event.key === '0' ||
  event.key === ')'

/* -- TYPES -- */

/**
 * Props for {@link useRichTextKeyboardShortcuts}.
 */
export type TRichTextKeyboardShortcuts_P = {
  /**
   * The editor the shortcuts act on.
   */
  editor: Editor
  /**
   * The rich text editor's toolbar that the shortcuts are for.
   */
  toolbar: TRichTextToolbarControls
}

/**
 * A format the keyboard can step through one option at a time.
 */
type TFormatCycleShortcut = {
  /**
   * The picker that opens when the shortcut runs, so the user can see which
   * option was applied.
   */
  picker: TRichTextPickerKey
  /**
   * Steps the format forward one option.
   */
  cycle: (editor: Editor) => void
}
