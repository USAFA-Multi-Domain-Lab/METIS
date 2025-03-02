import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import { Editor, EditorContent, EditorEvents, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { compute } from 'src/toolbox'
import {
  TButtonSvgDisabled,
  TButtonSvgType,
} from '../../user-controls/buttons/ButtonSvg'
import ButtonSvgPanel_v2 from '../../user-controls/buttons/ButtonSvgPanel_v2'
import './RichText.scss'
import MetisSpan from './nodes/span'
import MetisParagraph from './nodes/paragraph'
import { TRichText_P } from '.'

/**
 * Displays and manages rich text.
 */
export default function RichText({
  options,
  deps,
}: TRichText_P): JSX.Element | null {
  // Extract the options from the props.
  const {
    content,
    editable = true,
    placeholder = 'Enter text here...',
    listClassName,
    className,
    onUpdate,
    onBlur,
  } = options ?? {}

  /* -- GLOBAL CONTEXT -- */
  // const { prompt } = useGlobalContext().actions

  /* -- COMPUTED -- */

  /**
   * Determines how to group the toolbar buttons.
   */
  const toolbarGroupings: Array<TButtonSvgType[]> = [
    ['undo', 'redo'],
    ['ordered-list', 'unordered-list'],
    ['bold', 'italic', 'underline', 'strike'],
    ['code', 'code-block', 'link'],
    ['clear-format'],
  ]
  /**
   * The class name for the root element.
   */
  const rootClassName = compute(() => {
    let classList: string[] = ['RichText']
    if (!editable) classList.push('ReadOnly')
    if (className) classList.push(className)
    return classList.join(' ')
  })

  /* -- FUNCTIONS -- */

  /**
   * Toggles the link extension.
   * @param editor The editor instance.
   */
  const toggleLink = async (editor: Editor | null) => {
    if (!editor) return

    // Get the previous URL if it exists.
    const prevUrl = editor.getAttributes('link').href
    // Prompt the user for a URL.
    // const { choice, text: url } = await prompt('', ['Cancel', 'Submit'], {
    //   textField: {
    //     boundChoices: ['Submit'],
    //     label: 'URL',
    //     initialValue: prevUrl,
    //   },
    //   defaultChoice: 'Submit',
    // })
    // // Set the link.
    // if (choice === 'Submit') {
    //   editor
    //     .chain()
    //     .focus()
    //     .extendMarkRange('link')
    //     .setLink({ href: url })
    //     .run()
    // }
  }

  /**
   * Handles the button click event for the toolbar.
   * @param button The button that was clicked.
   * @param editor The editor instance.
   */
  const handleToolbarButtonClick = (button: TButtonSvgType, editor: Editor) => {
    switch (button) {
      case 'undo':
        editor.chain().focus().undo().run()
        break
      case 'redo':
        editor.chain().focus().redo().run()
        break
      case 'ordered-list':
        editor.chain().focus().toggleOrderedList().run()
        break
      case 'unordered-list':
        editor.chain().focus().toggleBulletList().run()
        break
      case 'bold':
        editor.chain().focus().toggleBold().run()
        break
      case 'italic':
        editor.chain().focus().toggleItalic().run()
        break
      case 'underline':
        editor.chain().focus().toggleUnderline().run()
        break
      case 'strike':
        editor.chain().focus().toggleStrike().run()
        break
      case 'code':
        editor.chain().focus().toggleCode().run()
        break
      case 'code-block':
        editor.chain().focus().toggleCodeBlock().run()
        break
      case 'link':
        toggleLink(editor)
        break
      case 'clear-format':
        editor.chain().focus().unsetAllMarks().run()
        break
    }
  }

  /**
   * Disables a button.
   * @param button The button to disable.
   * @returns The disabled state of the button.
   */
  const disableButton = (button: TButtonSvgType): TButtonSvgDisabled => {
    switch (button) {
      case 'undo':
        return !editor?.can().undo() ? 'full' : 'none'
      case 'redo':
        return !editor?.can().redo() ? 'full' : 'none'
      default:
        return 'none'
    }
  }

  /* -- PRE-RENDER PROCESSING -- */

  const editor = useEditor(
    {
      content,
      editable,
      onUpdate,
      onBlur,
      editorProps: {
        attributes: {
          class: 'Editor',
        },
        handleKeyDown: (view, event) => {
          // Handles the keyboard shortcut for the link extension.
          if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
            event.preventDefault()
            toggleLink(editor)
          }
        },
      },
      extensions: [
        StarterKit.configure({
          listItem: {
            HTMLAttributes: {
              class: listClassName,
            },
          },
        }),
        Underline,
        Placeholder.configure({
          placeholder,
        }),
        Link.configure({
          protocols: ['http', 'https'],
        }),
        MetisParagraph,
        MetisSpan,
      ],
    },
    [deps],
  )

  /**
   * @note Only renders if the editor is editable.
   */
  const toolbarJsx = compute((): JSX.Element | null => {
    if (!editor?.isEditable) return null
    return (
      <div className='Toolbar'>
        {toolbarGroupings.map((grouping, index) => (
          <ButtonSvgPanel_v2
            key={index} // todo: fix this to not use the index.
            buttons={grouping}
            onButtonClick={(button) => handleToolbarButtonClick(button, editor)}
            disableButton={disableButton}
          />
        ))}
      </div>
    )
  })

  /* -- RENDER -- */
  if (!editor) return null

  return (
    <div className={rootClassName}>
      {toolbarJsx}
      <EditorContent editor={editor} />
    </div>
  )
}
