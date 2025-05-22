import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import {
  BubbleMenu,
  Editor,
  EditorContent,
  FloatingMenu,
  useEditor,
} from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { all, createLowlight } from 'lowlight'
import { useGlobalContext } from 'src/context/global'
import { compute } from 'src/toolbox'
import { TRichText_P } from '.'
import {
  TButtonSvgDisabled,
  TButtonSvgType,
} from '../../user-controls/buttons/ButtonSvg'
import ButtonSvgPanel_v2 from '../../user-controls/buttons/ButtonSvgPanel_v2'
import './RichText.scss'
import MetisParagraph from './extensions/paragraph'
import MetisSpan from './extensions/span'

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
  const { prompt } = useGlobalContext().actions

  /* -- COMPUTED -- */

  /**
   * Determines how to group the buttons for the bubble toolbar.
   */
  const bubbleToolbarGroupings: Array<TButtonSvgType[]> = [
    [
      'undo',
      'redo',
      'ordered-list',
      'unordered-list',
      'bold',
      'italic',
      'underline',
      'strike',
      'code',
      'code-block',
      'link',
      'clear-format',
    ],
  ]
  /**
   * Determines how to group the buttons for the floating toolbar.
   */
  const floatingToolbarGroupings: Array<TButtonSvgType[]> = [
    ['ordered-list', 'unordered-list', 'code-block'],
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
    const { choice, text: url } = await prompt('', ['Cancel', 'Submit'], {
      textField: {
        boundChoices: ['Submit'],
        label: 'URL',
        initialValue: prevUrl,
      },
      defaultChoice: 'Submit',
    })
    // Set the link.
    if (choice === 'Submit') {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url })
        .run()
    }
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

  /**
   * Gets the class list for a button.
   * @param button The button for which to get the class list.
   * @param editor The editor instance.
   * @returns The class list for the button.
   */
  const getButtonClassList = (
    button: TButtonSvgType,
    editor: Editor | null,
  ): string[] => {
    switch (button) {
      case 'bold':
        return editor?.isActive('bold') ? ['Selected'] : ['NotSelected']
      case 'italic':
        return editor?.isActive('italic') ? ['Selected'] : ['NotSelected']
      case 'underline':
        return editor?.isActive('underline') ? ['Selected'] : ['NotSelected']
      case 'strike':
        return editor?.isActive('strike') ? ['Selected'] : ['NotSelected']
      case 'code':
        return editor?.isActive('code') ? ['Selected'] : ['NotSelected']
      case 'code-block':
        return editor?.isActive('codeBlock') ? ['Selected'] : ['NotSelected']
      case 'link':
        return editor?.isActive('link') ? ['Selected'] : ['NotSelected']
      case 'ordered-list':
        return editor?.isActive('orderedList') ? ['Selected'] : ['NotSelected']
      case 'unordered-list':
        return editor?.isActive('bulletList') ? ['Selected'] : ['NotSelected']

      default:
        return ['NotSelected']
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
          paragraph: false,
          codeBlock: false,
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
        CodeBlockLowlight.configure({
          lowlight: createLowlight(all),
          defaultLanguage: 'plaintext',
        }),
      ],
    },
    [deps],
  )

  /**
   * @note Only renders if the editor is editable.
   */
  const bubbleToolbarJsx = compute((): JSX.Element | null => {
    if (!editor?.isEditable) return null
    return (
      <div className='Toolbar'>
        {bubbleToolbarGroupings.map((grouping, index) => (
          <ButtonSvgPanel_v2
            key={index} // todo: fix this to not use the index.
            buttons={grouping}
            disableButton={disableButton}
            onButtonClick={(button) => handleToolbarButtonClick(button, editor)}
            getButtonClassList={(button) => getButtonClassList(button, editor)}
          />
        ))}
      </div>
    )
  })

  /**
   * @note Only renders if the editor is editable.
   */
  const floatingToolbarJsx = compute((): JSX.Element | null => {
    if (!editor?.isEditable) return null
    return (
      <div className='Toolbar'>
        {floatingToolbarGroupings.map((grouping, index) => (
          <ButtonSvgPanel_v2
            key={index} // todo: fix this to not use the index.
            buttons={grouping}
            disableButton={disableButton}
            onButtonClick={(button) => handleToolbarButtonClick(button, editor)}
            getButtonClassList={(button) => getButtonClassList(button, editor)}
          />
        ))}
      </div>
    )
  })

  /* -- RENDER -- */
  if (!editor) return null

  return (
    <div className={rootClassName}>
      <BubbleMenu editor={editor} className='BubbleToolbar'>
        {bubbleToolbarJsx}
      </BubbleMenu>
      <FloatingMenu editor={editor} className='FloatingToolbar'>
        {floatingToolbarJsx}
      </FloatingMenu>
      <EditorContent editor={editor} />
    </div>
  )
}
