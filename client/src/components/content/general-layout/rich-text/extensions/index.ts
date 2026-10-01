import { KEYBOARD_SHORTCUTS } from '@client/toolbox/keyboard'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Link from '@tiptap/extension-link'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import Placeholder from '@tiptap/extension-placeholder'
import { TableKit } from '@tiptap/extension-table'
import TextAlign from '@tiptap/extension-text-align'
import { Color, LineHeight, TextStyle } from '@tiptap/extension-text-style'
import { Markdown } from '@tiptap/markdown'
import type { Extensions } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { all, createLowlight } from 'lowlight'
import MetisParagraph from './paragraph'
import MetisSpan from './span'

/**
 * Shown on the empty line the cursor is on once an editor has text. An empty
 * line has nothing to select, and the toolbar otherwise only appears if text
 * has been selected.
 */
const TOOLBAR_SHORTCUT_HINT: string = `Press ${KEYBOARD_SHORTCUTS.pinRichTextToolbar.keystrokeLabel} for formatting options`

/**
 * Colors the code inside code blocks. It is built once and shared by every
 * piece of rich text, because building it registers every language it knows,
 * which is too slow to repeat each time rich text renders.
 */
const CODE_BLOCK_HIGHLIGHTER = createLowlight(all)

/**
 * The extensions shared by everything that displays rich text.
 * @param options How the shared extensions should be configured.
 */
function createSharedExtensions(options: TSharedExtensionOptions): Extensions {
  const { keepTrailingLine } = options

  return [
    StarterKit.configure({
      paragraph: false,
      codeBlock: false,
      link: false,
      // An empty paragraph is kept at the end of the content so there is
      // always a way to move the cursor out of certain HTML elements,
      // like block elements. Headings are excluded because they need no
      // escape route, and adding a line after one causes the heading
      // controls to malfunction. Lists need no escape route either
      // since there are other ways of escaping a list item.
      trailingNode: keepTrailingLine
        ? { notAfter: ['heading', 'bulletList', 'orderedList'] }
        : false,
    }),
    Link.configure({
      markdownLinks: true,
      isAllowedUri: (url, { defaultValidate }) => {
        const allowedProtocols = ['http:', 'https:']
        let protocol: string | null = null

        try {
          protocol = new URL(url).protocol
        } catch {
          protocol = null
        }

        if (protocol && !allowedProtocols.includes(protocol)) {
          return false
        }

        return defaultValidate(url)
      },
    }),
    MetisParagraph,
    MetisSpan,
    CodeBlockLowlight.configure({
      lowlight: CODE_BLOCK_HIGHLIGHTER,
      defaultLanguage: 'plaintext',
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph', 'codeBlock'],
    }),
    Color,
    LineHeight,
    Markdown.configure({
      markedOptions: {
        breaks: true,
        gfm: true,
      },
    }),
    TextStyle,
  ]
}

/**
 * The extensions for a rich-text editor someone writes in.
 * @param options How the editor's extensions should be configured.
 */
export function createEditorExtensions(
  options: TEditorExtensionOptions,
): Extensions {
  const { placeholder } = options

  return [
    ...createSharedExtensions({ keepTrailingLine: true }),
    Placeholder.configure({
      placeholder: ({ editor }) =>
        editor.isEmpty ? placeholder : TOOLBAR_SHORTCUT_HINT,
    }),
  ]
}

/**
 * The extensions for the rich text viewer.
 */
export function createViewerExtensions(): Extensions {
  return [
    ...createSharedExtensions({ keepTrailingLine: false }),
    // These 3 extensions below are not currently utilized anywhere in the
    // app. They are here for future-proofing and will especially be useful
    // when we render all of the documentation files via the UI.
    TableKit,
    TaskList,
    TaskItem,
  ]
}

/* -- TYPES -- */

/**
 * What {@link createSharedExtensions} needs to build the shared extensions.
 */
type TSharedExtensionOptions = {
  /**
   * Whether to keep an empty line at the end of the content so a cursor has
   * somewhere to go after a block element.
   * @note Only useful where there is a cursor.
   */
  keepTrailingLine: boolean
}

/**
 * What {@link createEditorExtensions} needs to build an editor's extensions.
 */
type TEditorExtensionOptions = {
  /**
   * The text shown while the editor is empty.
   */
  placeholder: string
}
