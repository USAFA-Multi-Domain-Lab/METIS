import { useGlobalContext } from '@client/context/global'
import { compute } from '@client/toolbox'
import { ClassList } from '@shared/toolbox/html/ClassList'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import type { Editor } from '@tiptap/react'
import {
  BubbleMenu,
  EditorContent,
  FloatingMenu,
  useEditor,
} from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { all, createLowlight } from 'lowlight'
import { useEffect } from 'react'
import type { TRichText_P } from '.'
import ButtonSvgPanel from '../../user-controls/buttons/panels/ButtonSvgPanel'
import { useButtonSvgEngine } from '../../user-controls/buttons/panels/hooks'
import If from '../../util/If'
import './RichText.scss'
import MetisParagraph from './extensions/paragraph'
import MetisSpan from './extensions/span'

/**
 * Displays and manages rich text.
 */
export default function RichText({
  options,
  deps,
}: TRichText_P): TReactElement | null {
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

  /* -- ENGINES -- */

  const bubbleToolbarButtonEngine = useButtonSvgEngine({
    elements: [
      {
        key: 'undo',
        type: 'button',
        icon: 'undo',
        onClick: () => editor?.chain().focus().undo().run(),
      },
      {
        key: 'redo',
        type: 'button',
        icon: 'redo',
        onClick: () => editor?.chain().focus().redo().run(),
      },
      {
        key: 'ordered-list',
        type: 'button',
        icon: 'ordered-list',
        onClick: () => editor?.chain().focus().toggleOrderedList().run(),
      },
      {
        key: 'bullet-list',
        type: 'button',
        icon: 'bullet-list',
        onClick: () => editor?.chain().focus().toggleBulletList().run(),
      },
      {
        key: 'bold',
        type: 'button',
        icon: 'bold',
        onClick: () => editor?.chain().focus().toggleBold().run(),
      },
      {
        key: 'italic',
        type: 'button',
        icon: 'italic',
        onClick: () => editor?.chain().focus().toggleItalic().run(),
      },
      {
        key: 'underline',
        type: 'button',
        icon: 'underline',
        onClick: () => editor?.chain().focus().toggleUnderline().run(),
      },
      {
        key: 'strike',
        type: 'button',
        icon: 'strike',
        onClick: () => editor?.chain().focus().toggleStrike().run(),
      },
      {
        key: 'code',
        type: 'button',
        icon: 'code',
        onClick: () => editor?.chain().focus().toggleCode().run(),
      },
      {
        key: 'code-block',
        type: 'button',
        icon: 'code-block',
        onClick: () => editor?.chain().focus().toggleCodeBlock().run(),
      },
      {
        key: 'link',
        type: 'button',
        icon: 'link',
        onClick: async () => await toggleLink(editor),
      },
      {
        key: 'clear-format',
        type: 'button',
        icon: 'clear-format',
        onClick: () => {
          editor?.chain().focus().unsetAllMarks().run()
          editor?.chain().focus().clearNodes().run()
        },
      },
    ],
  })

  const floatingToolbarButtonEngine = useButtonSvgEngine({
    elements: [
      {
        key: 'ordered-list',
        type: 'button',
        icon: 'ordered-list',
        onClick: () => editor?.chain().focus().toggleOrderedList().run(),
      },
      {
        key: 'bullet-list',
        type: 'button',
        icon: 'bullet-list',
        onClick: () => editor?.chain().focus().toggleBulletList().run(),
      },
      {
        key: 'code-block',
        type: 'button',
        icon: 'code-block',
        onClick: () => editor?.chain().focus().toggleCodeBlock().run(),
      },
    ],
  })

  /* -- COMPUTED -- */

  /**
   * The class name for the root element.
   */
  const rootClassName = compute<string>(() => {
    let classList = new ClassList('RichText')
    if (className) classList.add(className)
    return classList.value
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
   * Checks if the icon is active for the current selection within the editor.
   * @param icon The icon to check.
   * @returns True if the icon is active, false otherwise.
   */
  const isIconActive = (icon: TMetisIcon): boolean => {
    // Convert any kebab-case icon names to camelCase.
    // *** Note: This is necessary because the editor
    // *** uses "camelCase" for its active state checks.
    // *** For example, 'ordered-list' becomes 'orderedList'.
    const camelCaseIcon = icon.replace(/-([a-z])/g, (g) => g[1].toUpperCase())

    // Check if the editor is active for the icon.
    return editor?.isActive(camelCaseIcon) ?? false
  }

  /**
   * Checks if a button should be disabled based on the editor's capabilities.
   * @param button The button to disable.
   * @returns True if the button should be disabled, false otherwise.
   */
  const isButtonDisabled = (button: TMetisIcon): boolean => {
    switch (button) {
      case 'undo':
        return !editor?.can().undo()
      case 'redo':
        return !editor?.can().redo()
      default:
        return false
    }
  }

  /* -- EFFECTS -- */

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

  // Update the bubble toolbar button engine
  // properties when the input content changes.
  useEffect(() => {
    bubbleToolbarButtonEngine.buttons.forEach(({ icon }) => {
      // Set the class list for the button.
      bubbleToolbarButtonEngine.modifyClassList(icon, (classList) =>
        classList.switch('Selected', 'NotSelected', isIconActive(icon)),
      )

      // Set the disabled state for the button.
      const disabled = isButtonDisabled(icon)
      bubbleToolbarButtonEngine.setDisabled(icon, disabled)
    })
  }, [content])

  // Update the floating toolbar button engine
  // properties when the input content changes.
  useEffect(() => {
    floatingToolbarButtonEngine.buttons.forEach(({ icon }) => {
      // Set the class list for the button.
      floatingToolbarButtonEngine.modifyClassList(icon, (classList) =>
        classList.switch('Selected', 'NotSelected', editor?.isActive(icon)),
      )

      // Set the disabled state for the button.
      const disabled = isButtonDisabled(icon)
      floatingToolbarButtonEngine.setDisabled(icon, disabled)
    })
  }, [content])

  /* -- RENDER -- */
  if (!editor) return null

  return (
    <div className={rootClassName}>
      <BubbleMenu editor={editor} className='BubbleToolbar'>
        <If condition={editor.isEditable}>
          <div className='Toolbar'>
            <ButtonSvgPanel engine={bubbleToolbarButtonEngine} />
          </div>
        </If>
      </BubbleMenu>
      <FloatingMenu editor={editor} className='FloatingToolbar'>
        <If condition={editor.isEditable}>
          <div className='Toolbar'>
            <ButtonSvgPanel engine={floatingToolbarButtonEngine} />
          </div>
        </If>
      </FloatingMenu>
      <EditorContent editor={editor} />
    </div>
  )
}
