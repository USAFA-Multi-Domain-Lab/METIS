import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import './RichTextOutputBox.scss'

/**
 * Displays rich text.
 */
export default function RichTextOutputBox({
  text,
  options,
}: TRichTextOutputBox_P): JSX.Element {
  const { deps, listItemClassName, ref } = options ?? {}

  // Create the tiptap editor.
  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          listItem: {
            HTMLAttributes: {
              class: listItemClassName,
            },
          },
        }),
        Underline,
        Link.configure({
          defaultProtocol: 'https',
        }),
      ],
      content: text,
      editable: false,
    },
    [deps],
  )

  /* -- RENDER -- */
  return (
    <EditorContent editor={editor} ref={ref} className='RichTextOutputBox' />
  )
}

/* ---------------------------- TYPES FOR RICH TEXT OUTPUT BOX ---------------------------- */

/**
 * Prop type for`RichTextOutputBox`.
 */
type TRichTextOutputBox_P = {
  /**
   * The HTML element (wrapped in a string) to be displayed.
   */
  text: string
  /**
   * Options for the component.
   */
  options?: {
    /**
     * The class name to be applied to the list item.
     */
    listItemClassName?: string
    /**
     * The dependencies for the component.
     */
    deps?: any[]
    /**
     * The reference to the HTML element.
     */
    ref?: React.RefObject<HTMLDivElement>
  }
}
