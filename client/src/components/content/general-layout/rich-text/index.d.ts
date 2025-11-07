import type { EditorEvents } from '@tiptap/react'

/**
 * Props for `RichText` component.
 */
export type TRichText_P = {
  options?: TRichTextOptions
  /**
   * The dependencies for the component.
   * @note This is used to re-render the editor when the dependencies change.
   */
  deps?: React.DependencyList
}

/**
 * The options for the `RichText` component.
 */
export type TRichTextOptions = {
  /**
   * The content to display in the editor.
   */
  content?: string
  /**
   * Indicates whether the editor is editable.
   * @default true
   */
  editable?: boolean
  /**
   * The placeholder text.
   * @default 'Enter text here...'
   */
  placeholder?: string
  /**
   * The class name for the list items in the editor.
   */
  listClassName?: string
  /**
   * The class name for the root element.
   */
  className?: string
  /**
   * The event handler for the update event.
   * @note Equivalent to the `onChange` event for a text input.
   */
  onUpdate?: (props: EditorEvents['update']) => void
  /**
   * The event handler for the blur event.
   * @note Equivalent to the `onBlur` event for a text input.
   */
  onBlur?: (props: EditorEvents['blur']) => void
}
