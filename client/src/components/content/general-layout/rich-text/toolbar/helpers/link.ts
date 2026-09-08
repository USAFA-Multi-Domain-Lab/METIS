import type { Editor } from '@tiptap/react'

/**
 * Whether the link prompt has anything to act on. A link is applied to the
 * text that is selected, so with nothing selected there is nothing to put a
 * link on. The exception is a cursor sitting inside a link already, which the
 * prompt can change or remove.
 * @param editor The editor to read.
 * @returns `True` when the prompt can add, change, or remove a link.
 */
export const canOpenLinkPrompt = (editor: Editor): boolean =>
  !editor.state.selection.empty || editor.isActive('link')
