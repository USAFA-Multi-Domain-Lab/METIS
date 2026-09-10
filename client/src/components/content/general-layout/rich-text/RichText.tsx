import { LocalContext, LocalContextProvider } from '@client/context/local'
import { compute } from '@client/toolbox'
import { ClassList } from '@shared/toolbox/html/ClassList'
import type { Editor, EditorEvents } from '@tiptap/react'
import { EditorContent, useEditor } from '@tiptap/react'
import { Suspense, lazy, useEffect, useRef } from 'react'
import './RichText.scss'
import { createEditorExtensions, createViewerExtensions } from './extensions'

/**
 * The toolbar, and everything behind it, is fetched only once someone is
 * writing. Rich text that is only being read is shown in places that appear
 * constantly, such as tooltips and notifications, and none of them should be
 * loading an editing interface they will never show.
 */
const RichTextToolbar = lazy(() => import('./toolbar/RichTextToolbar'))

/**
 * Local context for a piece of rich text, which is how the toolbar and its
 * pickers reach the editor and the elements they measure themselves against.
 */
const richTextContext = new LocalContext<{}, TRichText_C, {}, TRichText_E>()

/**
 * Hook used inside a piece of rich text to reach its editor and elements.
 */
export const useRichTextContext = richTextContext.getHook()

/**
 * Displays rich text, and lets it be written in when it is an editor.
 *
 * Viewers and editors share one component so a piece of text looks the same
 * wherever it appears. A viewer builds none of the writing tools: no toolbar
 * buttons, no keyboard shortcuts, and no toolbar. That matters because
 * viewers show up in places that render constantly, such as tooltips and
 * notifications.
 */
export default function RichText(props: TRichText_P): TReactElement | null {
  const {
    content,
    type,
    format = 'html',
    placeholder = 'Enter text here...',
    className,
    editorRef,
    onUpdate,
    onFocus,
    onBlur,
    toolbarAnchor,
    deps = undefined,
  } = props

  /* -- COMPUTED -- */

  /**
   * Whether the text can be written in.
   */
  const isEditor = type === 'editor'

  /**
   * The class name for the root element.
   */
  const rootClassName = compute<string>(() => {
    let classList = new ClassList('RichText')
    if (className) classList.add(className)
    return classList.value
  })

  /* -- REFS -- */

  // The root element. The rich text toolbar uses this to dynamically change
  // its width.
  const richTextElement = useRef<HTMLDivElement>(null)

  // The markdown last handed to the editor. Markdown cannot be compared
  // against what the editor is showing, because the editor reports HTML, so
  // what was last applied is remembered instead.
  const appliedMarkdown = useRef<string | null>(null)

  /* -- HOOKS -- */

  const editor = useEditor(
    {
      content,
      editable: isEditor,
      onCreate: ({ editor: newEditor }) => {
        if (editorRef) editorRef.current = newEditor
      },
      onUpdate,
      onFocus,
      onBlur,
      editorProps: {
        attributes: {
          class: isEditor ? 'Editor' : 'Viewer',
        },
      },
      extensions: isEditor
        ? createEditorExtensions({ placeholder })
        : createViewerExtensions(),
    },
    [type, ...(deps ?? [])],
  )

  // Keeps the editor showing the content it was handed. Tiptap reads its
  // content once, when the editor is built, so a later change has to be given
  // to it directly. Both an editor and a viewer run this, which is what keeps
  // a change to the same text behaving the same way either way.
  useEffect(() => {
    if (!editor || content === undefined) return

    if (format === 'markdown') {
      if (appliedMarkdown.current === content) return
      editor.commands.setContent(content, { contentType: 'markdown' })
      appliedMarkdown.current = content
      return
    }

    // Checks whether the editor is already displaying the given HTML.
    // A direct comparison is not enough for empty values. An editor with
    // nothing in it reports `<p></p>`, and a value holding nothing but spaces
    // is stored as an empty string, so neither one ever matches an empty
    // incoming value.
    const isHtmlDisplayed = (): boolean => {
      if (!editor) return false
      if (editor.getHTML() === content) return true
      return content === '' && editor.getText().trim() === ''
    }

    // This check prevents a feedback loop with typing: when the user
    // types, the new value comes back around as `content`, and by the time
    // this runs the editor is already showing it.
    if (!isHtmlDisplayed()) {
      editor.commands.setContent(content)
    }
  }, [editor, content])

  /* -- RENDER -- */

  if (!editor) return null

  return (
    <LocalContextProvider
      context={richTextContext}
      defaultedProps={{}}
      computed={{ editor }}
      state={{}}
      elements={{ richTextElement, toolbarAnchor }}
    >
      <div className={rootClassName} ref={richTextElement}>
        {isEditor && (
          <Suspense fallback={null}>
            <RichTextToolbar />
          </Suspense>
        )}
        <EditorContent editor={editor} />
      </div>
    </LocalContextProvider>
  )
}

/* -- TYPES -- */

/**
 * What a {@link RichText} is for: reading its content, or writing it.
 */
export type TRichTextType = 'viewer' | 'editor'

/**
 * The format of the content being displayed.
 */
export type TRichTextFormat = 'html' | 'markdown'

/**
 * Computed values a piece of rich text provides to everything inside it.
 */
export type TRichText_C = {
  /**
   * The Tiptap editor instance behind this piece of rich text.
   */
  editor: Editor
}

/**
 * The elements a piece of rich text provides to everything inside it.
 */
export type TRichText_E = {
  /**
   * The root element, watched by the toolbar so it can keep itself inside the
   * editor's width.
   */
  richTextElement: React.RefObject<HTMLDivElement | null>
  /**
   * A scrollable container the toolbar should stay inside.
   * @see {@link TRichText_P.toolbarAnchor}
   */
  toolbarAnchor?: React.RefObject<HTMLElement | null>
}

/**
 * Props for {@link RichText}.
 */
export type TRichText_P = {
  /**
   * The content to display.
   * @note Left off by an editor that holds no value of its own, such as the
   * messenger composer, which reads what was typed through {@link editorRef}
   * at the moment it is sent.
   */
  content?: string
  /**
   * Whether the text is read or written. A `'viewer'` builds none of the
   * writing tools, so it costs no more than the text it shows.
   */
  type: TRichTextType
  /**
   * How {@link content} is written. Markdown is handed to places that build
   * their text in code, such as tooltips and notifications, while text that
   * came out of the editor is HTML.
   * @default 'html'
   */
  format?: TRichTextFormat
  /**
   * The placeholder text.
   * @default 'Enter text here...'
   */
  placeholder?: string
  /**
   * The class name for the root element.
   */
  className?: string
  /**
   * A ref that receives the Tiptap {@link Editor} instance once the editor
   * mounts. Use this when the parent needs to imperatively read content or
   * run commands (e.g. `clearContent`) without re-rendering on every keystroke.
   */
  editorRef?: React.RefObject<Editor | null>
  /**
   * The event handler for the update event.
   * @note Equivalent to the `onChange` event for a text input.
   */
  onUpdate?: (props: EditorEvents['update']) => void
  /**
   * The event handler for the focus event.
   * @note Equivalent to the `onFocus` event for a text input.
   */
  onFocus?: (props: EditorEvents['focus']) => void
  /**
   * The event handler for the blur event.
   * @note Equivalent to the `onBlur` event for a text input.
   */
  onBlur?: (props: EditorEvents['blur']) => void
  /**
   * A ref to a scrollable container that wraps this editor. When provided,
   * the toolbar's vertical position is clamped to the container's visible
   * top edge so the toolbar never goes above the visible top edge for times like
   * selecting a large amount of text that has overflowed and scrolled out of view.
   */
  toolbarAnchor?: React.RefObject<HTMLElement | null>
  /**
   * The dependencies that rebuild the editor when they change.
   */
  deps?: React.DependencyList
}
