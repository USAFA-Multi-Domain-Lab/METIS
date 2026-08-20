import type { Editor } from '@tiptap/react'
import { useRef } from 'react'
import type { ButtonSvgEngine } from '../../../../user-controls/buttons/panels/engines'
import type { TRichTextPickerKey, TRichTextToolbar_S } from '../RichTextToolbar'
import { useRichTextKeyboardShortcuts } from './useRichTextKeyboardShortcuts'
import { useRichTextToolbarButtons } from './useRichTextToolbarButtons'

/**
 * The name the toolbar is registered under. The tiptap editor's `setMeta` commands
 * address the toolbar by this name to show it, hide it, and reposition it.
 */
export const RICH_TEXT_TOOLBAR_PLUGIN_KEY = 'richTextToolbar'

/**
 * Gathers everything the toolbar can do onto one object.
 * @returns The toolbar.
 */
export function useRichTextToolbar({
  editor,
  state,
}: TRichTextToolbarSetup): TRichTextToolbar {
  const [activePicker, setActivePicker] = state.activePicker
  const [isPinned, setIsPinned] = state.isPinned

  // Set when the user hides the toolbar manually, which keeps it hidden even
  // while text is selected.
  const isSuppressed = useRef<boolean>(false)

  // Sends one of the toolbar's own commands to the editor.
  const signal = (action: TRichTextToolbarAction) => {
    editor.commands.setMeta(RICH_TEXT_TOOLBAR_PLUGIN_KEY, action)
  }

  const controls: TRichTextToolbarControls = {
    state,
    isSuppressed,
    signal,

    showPicker: (key) => {
      setIsPinned(true)
      setActivePicker(key)
    },

    togglePicker: (key) => setActivePicker(activePicker === key ? null : key),

    togglePinned: () => {
      if (isPinned) setActivePicker(null)
      setIsPinned((pinned) => !pinned)
    },

    dismiss: () => {
      // The first ask puts the open picker away. Only once nothing is left
      // showing does the toolbar itself go.
      if (activePicker) {
        setActivePicker(null)
        return
      }

      setIsPinned(false)
      isSuppressed.current = true
      signal('hide')
    },
  }

  const { buttonEngine, updateButtonClassNames } = useRichTextToolbarButtons({
    editor,
    toolbar: controls,
  })
  const handleKeyDown = useRichTextKeyboardShortcuts({
    editor,
    toolbar: controls,
  })

  return { ...controls, buttonEngine, updateButtonClassNames, handleKeyDown }
}

/* -- TYPES -- */

/**
 * The commands the toolbar understands.
 */
export type TRichTextToolbarAction = 'show' | 'hide' | 'updatePosition'

/**
 * What {@link useRichTextToolbar} builds the toolbar from.
 */
export type TRichTextToolbarSetup = {
  /**
   * The editor the toolbar acts on.
   */
  editor: Editor
  /**
   * The state the toolbar and its pickers share.
   */
  state: TRichTextToolbar_S
}

/**
 * What the toolbar keeps and what it can be told to do.
 */
export type TRichTextToolbarControls = {
  /**
   * The state in the shape the local context provides to pickers.
   */
  state: TRichTextToolbar_S
  /**
   * Set when the user hides the toolbar manually, which keeps it hidden even
   * while text is selected. Cleared on the next selection change, or when
   * focus leaves the editor.
   */
  isSuppressed: React.RefObject<boolean>
  /**
   * Tells the toolbar to show itself, hide itself, or move back into place.
   * @param action What the toolbar should do.
   * @note This is how the toolbar is moved outside of a selection change,
   * which is the only time the editor decides on its own.
   */
  signal: (action: TRichTextToolbarAction) => void
  /**
   * Shows a picker whether or not it was already showing, holding the toolbar
   * open so the picker has something to sit on.
   */
  showPicker: (key: TRichTextPickerKey) => void
  /**
   * Shows/Hides a picker within the toolbar.
   */
  togglePicker: (key: TRichTextPickerKey) => void
  /**
   * Opens/Closes the toolbar at the cursor's location.
   */
  togglePinned: () => void
  /**
   * Puts away whatever the user is looking at, an open picker first and the
   * toolbar itself once no picker is left. A dismissed toolbar stays hidden
   * until the selection changes.
   */
  dismiss: () => void
}

/**
 * Everything the toolbar is and can do, on one object.
 */
export type TRichTextToolbar = TRichTextToolbarControls & {
  /**
   * The engine holding the toolbar's buttons.
   */
  buttonEngine: ButtonSvgEngine
  /**
   * Updates every button in the toolbar.
   * @note Updates can include things like highlighting a format
   * button if the text at the cursor's location is using that same
   * format and disabling a button if its command cannot be run.
   */
  updateButtonClassNames: () => void
  /**
   * Answers a key pressed inside the editor.
   */
  handleKeyDown: (event: KeyboardEvent) => void
}
