import type { TKeyboardShortcut } from '@client/toolbox/keyboard'
import {
  KEYBOARD_SHORTCUTS,
  UNMODIFIED_KEYSTROKES,
} from '@client/toolbox/keyboard'
import type { Editor } from '@tiptap/react'
import { cycleFontColor } from '../helpers/font-color'
import { cycleHeadingLevel } from '../helpers/heading'
import { canOpenLinkPrompt } from '../helpers/link'
import { cycleLineSpacing } from '../helpers/line-spacing'
import { cycleTextAlign } from '../helpers/text-align'
import type { TRichTextPickerKey } from '../RichTextToolbar'
import { useRichTextLinkPrompt } from './useRichTextLinkPrompt'
import type { TRichTextToolbarControls } from './useRichTextToolbar'

/**
 * The formats a shortcut can step through, each paired with the shortcut
 * that steps it.
 */
const FORMAT_CYCLE_SHORTCUTS: TFormatCycleShortcut[] = [
  {
    shortcut: KEYBOARD_SHORTCUTS.cycleRichTextFontColor,
    picker: 'color',
    cycle: cycleFontColor,
  },
  {
    shortcut: KEYBOARD_SHORTCUTS.cycleRichTextHeadingLevel,
    picker: 'heading',
    cycle: cycleHeadingLevel,
  },
  {
    shortcut: KEYBOARD_SHORTCUTS.cycleRichTextAlignment,
    picker: 'align',
    cycle: cycleTextAlign,
  },
  {
    shortcut: KEYBOARD_SHORTCUTS.cycleRichTextLineSpacing,
    picker: 'line-spacing',
    cycle: cycleLineSpacing,
  },
]

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
    // Escape — puts away an open picker, then the toolbar itself.
    if (UNMODIFIED_KEYSTROKES.escape.matches(event)) {
      event.preventDefault()
      toolbar.dismiss()
    }

    // Cmd/Ctrl+K — toggle link.
    if (KEYBOARD_SHORTCUTS.toggleRichTextLink.matches(event)) {
      event.preventDefault()
      if (canOpenLinkPrompt(editor)) {
        toggleLink(editor)
      }
    }

    // Cmd+Opt+0 / Ctrl+Alt+0 — clear all formatting.
    if (KEYBOARD_SHORTCUTS.clearRichTextFormatting.matches(event)) {
      event.preventDefault()
      editor.commands.unsetAllMarks()
      editor.commands.clearNodes()
    }

    // Cmd/Ctrl+Shift+M — show/hide the toolbar at the cursor's location.
    if (KEYBOARD_SHORTCUTS.pinRichTextToolbar.matches(event)) {
      event.preventDefault()
      toolbar.togglePinned()
    }

    // Cmd/Ctrl+Shift +C / +H / +A / +P - step a format forward one option.
    let formatShortcut = FORMAT_CYCLE_SHORTCUTS.find(({ shortcut }) =>
      shortcut.matches(event),
    )
    if (formatShortcut) {
      event.preventDefault()
      toolbar.showPicker(formatShortcut.picker)
      formatShortcut.cycle(editor)
    }
  }
}

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
   * The keystroke that steps the format forward.
   */
  shortcut: TKeyboardShortcut
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
