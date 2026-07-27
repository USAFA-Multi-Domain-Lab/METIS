import { useGlobalContext } from '@client/context/global'
import { LocalContext, LocalContextProvider } from '@client/context/local'
import { compute, getOs } from '@client/toolbox'
import { useResizeObserver } from '@client/toolbox/hooks'
import { Mission } from '@shared/missions/Mission'
import { ClassList } from '@shared/toolbox/html/ClassList'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import { Color, LineHeight, TextStyle } from '@tiptap/extension-text-style'
import { Markdown } from '@tiptap/markdown'
import type { EditorState } from '@tiptap/pm/state'
import type { Editor, EditorEvents } from '@tiptap/react'
import { EditorContent, useEditor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import { all, createLowlight } from 'lowlight'
import { useEffect, useRef, useState } from 'react'
import ButtonSvgPanel from '../../user-controls/buttons/panels/ButtonSvgPanel'
import { useButtonSvgEngine } from '../../user-controls/buttons/panels/hooks'
import './RichText.scss'
import MetisParagraph from './extensions/paragraph'
import MetisSpan from './extensions/span'
import RichTextAlignPicker, {
  ALIGN_OPTIONS,
} from './subcomponents/RichTextAlignPicker'
import RichTextColorPicker, {
  normalizeColor,
} from './subcomponents/RichTextColorPicker'
import RichTextHeadingPicker, {
  HEADING_LEVELS,
} from './subcomponents/RichTextHeadingPicker'
import RichTextLineSpacingPicker, {
  LINE_HEIGHT_OPTIONS,
} from './subcomponents/RichTextLineSpacingPicker'

/**
 * Local context for the {@link RichText} component.
 */
const richTextContext = new LocalContext<
  TRichText_P,
  TRichText_C,
  TRichText_S,
  {}
>()

/**
 * Hook used by RichText subcomponents to access the RichText context.
 */
export const useRichTextContext = richTextContext.getHook()

/**
 * Displays and manages rich text.
 */
export default function RichText(props: TRichText_P): TReactElement | null {
  const defaultedProps: Required<TRichText_P> = {
    options: props.options ?? {},
    deps: props.deps ?? [],
  }
  const { options, deps } = defaultedProps

  // Extract the options.
  const {
    content,
    editable = true,
    placeholder = 'Enter text here...',
    listClassName,
    className,
    editorRef,
    onUpdate,
    onFocus,
    onBlur,
    bubbleMenuAnchor,
  } = options

  /* -- GLOBAL CONTEXT -- */
  const { prompt } = useGlobalContext().actions

  /* -- STATE -- */

  const state: TRichText_S = {
    isColorPickerOpen: useState<boolean>(false),
    isHeadingPickerOpen: useState<boolean>(false),
    isAlignPickerOpen: useState<boolean>(false),
    isLineSpacingPickerOpen: useState<boolean>(false),
    containerWidth: useState<number>(0),
    isBubbleMenuForcedOpen: useState<boolean>(false),
  }
  const [isColorPickerOpen, setIsColorPickerOpen] = state.isColorPickerOpen
  const [isHeadingPickerOpen, setIsHeadingPickerOpen] =
    state.isHeadingPickerOpen
  const [isAlignPickerOpen, setIsAlignPickerOpen] = state.isAlignPickerOpen
  const [isLineSpacingPickerOpen, setIsLineSpacingPickerOpen] =
    state.isLineSpacingPickerOpen
  const [containerWidth, setContainerWidth] = state.containerWidth
  const [isBubbleMenuForcedOpen, setIsBubbleMenuForcedOpen] =
    state.isBubbleMenuForcedOpen

  /* -- REFS -- */

  // Used to resize the bubble menu when the container size changes
  // so that it doesn't overflow horizontally.
  const container = useRef<HTMLDivElement>(null)
  // Used to help know when the bubble menu should be hidden or shown.
  const bubbleMenuSuppressedRef = useRef<boolean>(false)
  // Used to help trigger displaying the bubble menu when a new line is created.
  const isCursorOnNewLine = useRef<boolean>(false)

  /* -- ENGINE(S) -- */

  const bubbleToolbarButtonEngine = useButtonSvgEngine({
    elements: [
      {
        key: 'undo',
        type: 'button',
        icon: 'undo',
        label: '**Undo**',
        description: getOs() === 'windows' ? '`ctrl+z`' : '`cmd+z`',
        onClick: () => editor?.commands.undo(),
      },
      {
        key: 'redo',
        type: 'button',
        icon: 'redo',
        label: '**Redo**',
        description: getOs() === 'windows' ? '`ctrl+shift+z`' : '`cmd+shift+z`',
        onClick: () => editor?.commands.redo(),
      },
      {
        key: 'ordered-list',
        type: 'button',
        icon: 'ordered-list',
        label: '**Ordered List**',
        description: getOs() === 'windows' ? '`ctrl+shift+7`' : '`cmd+shift+7`',
        onClick: () => editor?.commands.toggleOrderedList(),
      },
      {
        key: 'bullet-list',
        type: 'button',
        icon: 'bullet-list',
        label: '**Bullet List**',
        description: getOs() === 'windows' ? '`ctrl+shift+8`' : '`cmd+shift+8`',
        onClick: () => editor?.commands.toggleBulletList(),
      },
      {
        key: 'text-align',
        type: 'button',
        icon: 'align-left',
        label: '**Text Align**',
        description:
          getOs() === 'windows'
            ? '`ctrl+shift+a` to cycle'
            : '`cmd+shift+a` to cycle',
        onClick: () => openSubPanel(setIsAlignPickerOpen, isAlignPickerOpen),
      },
      {
        key: 'line-spacing',
        type: 'button',
        icon: 'line-spacing',
        label: '**Line Spacing**',
        description:
          getOs() === 'windows'
            ? '`ctrl+shift+p` to cycle'
            : '`cmd+shift+p` to cycle',
        onClick: () =>
          openSubPanel(setIsLineSpacingPickerOpen, isLineSpacingPickerOpen),
      },
      {
        key: 'heading',
        type: 'button',
        icon: 'heading',
        label: '**Headings**',
        description:
          getOs() === 'windows'
            ? '`ctrl+shift+h` to cycle'
            : '`cmd+shift+h` to cycle',
        onClick: () =>
          openSubPanel(setIsHeadingPickerOpen, isHeadingPickerOpen),
      },
      {
        key: 'bold',
        type: 'button',
        icon: 'bold',
        label: '**Bold**',
        description: getOs() === 'windows' ? '`ctrl+b`' : '`cmd+b`',
        onClick: () => editor?.commands.toggleBold(),
      },
      {
        key: 'italic',
        type: 'button',
        icon: 'italic',
        label: '**Italic**',
        description: getOs() === 'windows' ? '`ctrl+i`' : '`cmd+i`',
        onClick: () => editor?.commands.toggleItalic(),
      },
      {
        key: 'underline',
        type: 'button',
        icon: 'underline',
        label: '**Underline**',
        description: getOs() === 'windows' ? '`ctrl+u`' : '`cmd+u`',
        onClick: () => editor?.commands.toggleUnderline(),
      },
      {
        key: 'strike',
        type: 'button',
        icon: 'strike',
        label: '**Strikethrough**',
        description: getOs() === 'windows' ? '`ctrl+shift+s`' : '`cmd+shift+s`',
        onClick: () => editor?.commands.toggleStrike(),
      },
      {
        key: 'font-color',
        type: 'button',
        icon: 'font-color',
        label: '**Font Color**',
        description:
          getOs() === 'windows'
            ? '`ctrl+shift+c` to cycle'
            : '`cmd+shift+c` to cycle',
        onClick: () => openSubPanel(setIsColorPickerOpen, isColorPickerOpen),
      },
      {
        key: 'code',
        type: 'button',
        icon: 'code',
        label: '**Inline Code**',
        description: getOs() === 'windows' ? '`ctrl+e`' : '`cmd+e`',
        onClick: () => editor?.commands.toggleCode(),
      },
      {
        key: 'code-block',
        type: 'button',
        icon: 'code-block',
        label: '**Code Block**',
        description: getOs() === 'windows' ? '`ctrl+alt+c`' : '`cmd+opt+c`',
        onClick: () => editor?.commands.toggleCodeBlock(),
      },
      {
        key: 'link',
        type: 'button',
        icon: 'link',
        label: '**Link**',
        description: getOs() === 'windows' ? '`ctrl+k`' : '`cmd+k`',
        onClick: async () => await toggleLink(editor),
      },
      {
        key: 'blockquote',
        type: 'button',
        icon: 'blockquote',
        label: '**Blockquote**',
        description: getOs() === 'windows' ? '`ctrl+shift+b`' : '`cmd+shift+b`',
        onClick: () => editor?.commands.toggleBlockquote(),
      },
      {
        key: 'clear-format',
        type: 'button',
        icon: 'clear-format',
        label: '**Clear Format**',
        description: getOs() === 'windows' ? '`ctrl+alt+0`' : '`cmd+opt+0`',
        onClick: () => {
          editor?.commands.unsetAllMarks()
          editor?.commands.clearNodes()
        },
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

  /**
   * The CSS styling for the bubble menu toolbar.
   */
  const toolbarStyle = compute<React.CSSProperties>(() => {
    let style: React.CSSProperties = {}

    // We set the max width here so that the buttons
    // in the toolbar break to a new line when their
    // container's width gets too small.
    if (containerWidth > 0) style.maxWidth = containerWidth

    return style
  })

  /* -- FUNCTIONS -- */

  /**
   * Toggles the link extension.
   * @param editor The rich text editor instance.
   */
  const toggleLink = async (editor: Editor | null) => {
    if (!editor) return

    const hasLink = editor.isActive('link')
    const prevUrl = hasLink ? (editor.getAttributes('link').href as string) : ''

    const choices = hasLink
      ? (['Cancel', 'Remove', 'Submit'] as ['Cancel', 'Remove', 'Submit'])
      : (['Cancel', 'Submit'] as ['Cancel', 'Submit'])

    const { choice, text: url } = await prompt('', choices, {
      textField: {
        boundChoices: ['Submit'],
        label: 'URL',
        initialValue: prevUrl,
      },
      dangerousChoices: hasLink ? ['Remove'] : [],
      defaultChoice: 'Submit',
    })

    if (choice === 'Remove') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else if (choice === 'Submit') {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url })
        .run()
    }
  }

  /**
   * Cycles through the heading levels for the current selection.
   */
  const cycleHeading = () => {
    if (!editor) return

    setIsBubbleMenuForcedOpen(true)
    closeAllSubPanels()
    setIsHeadingPickerOpen(true)

    const activeLevel = HEADING_LEVELS.find((level) =>
      editor.isActive('heading', { level }),
    )
    const currentIndex =
      activeLevel !== undefined ? HEADING_LEVELS.indexOf(activeLevel) : -1

    const nextIndex =
      currentIndex >= HEADING_LEVELS.length - 1 ? 0 : currentIndex + 1

    editor.commands.toggleHeading({ level: HEADING_LEVELS[nextIndex] })
  }

  /**
   * Cycles through the approved font colors for the current selection.
   */
  const cycleColor = () => {
    if (!editor) return

    setIsBubbleMenuForcedOpen(true)
    closeAllSubPanels()
    setIsColorPickerOpen(true)

    const currentColor = editor.getAttributes('textStyle').color as
      | string
      | undefined

    let currentIndex = currentColor
      ? Mission.COLOR_OPTIONS.findIndex(
          (c) => normalizeColor(c) === normalizeColor(currentColor),
        )
      : -1

    if (currentIndex >= Mission.COLOR_OPTIONS.length - 1) {
      currentIndex = -1
    }

    editor.commands.setColor(Mission.COLOR_OPTIONS[currentIndex + 1])
  }

  /**
   * Cycles through the alignment options for the current selection.
   */
  const cycleAlign = () => {
    if (!editor) return

    setIsBubbleMenuForcedOpen(true)
    closeAllSubPanels()
    setIsAlignPickerOpen(true)

    const currentAlign = ALIGN_OPTIONS.find((option) =>
      editor.isActive({ textAlign: option.value }),
    )
    const currentIndex = currentAlign ? ALIGN_OPTIONS.indexOf(currentAlign) : -1

    const nextIndex =
      currentIndex >= ALIGN_OPTIONS.length - 1 ? 0 : currentIndex + 1

    editor.commands.setTextAlign(ALIGN_OPTIONS[nextIndex].value)
  }

  /**
   * Cycles through the line spacing options for the current selection.
   */
  const cycleLineSpacing = () => {
    if (!editor) return

    setIsBubbleMenuForcedOpen(true)
    closeAllSubPanels()
    setIsLineSpacingPickerOpen(true)

    const currentLineHeight = editor.getAttributes('textStyle').lineHeight as
      | string
      | undefined

    let currentIndex = currentLineHeight
      ? LINE_HEIGHT_OPTIONS.indexOf(currentLineHeight)
      : -1

    if (currentIndex >= LINE_HEIGHT_OPTIONS.length - 1) {
      currentIndex = -1
    }

    editor.commands.setLineHeight(LINE_HEIGHT_OPTIONS[currentIndex + 1])
  }

  /**
   * Checks if the icon with a sub-panel is active.
   * @param icon The icon to check.
   */
  const isIconWithSubPanelActive = (icon: TMetisIcon): boolean => {
    switch (icon) {
      case 'heading': {
        // *** Note: heading creates a block-level element which
        // *** gets handled in the "isIconActive" function. So,
        // *** we only need to check if the heading sub-panel is open.
        if (isHeadingPickerOpen) return true
        break
      }
      case 'font-color': {
        const hasColoredText = !!editor?.getAttributes('textStyle').color
        if (isColorPickerOpen || hasColoredText) return true
        break
      }
      case 'line-spacing': {
        const hasLineSpacing = LINE_HEIGHT_OPTIONS.some((spacing) =>
          editor?.isActive('textStyle', { lineHeight: spacing }),
        )
        if (isLineSpacingPickerOpen || hasLineSpacing) return true
        break
      }
      case 'align-left':
      case 'align-center':
      case 'align-right':
      case 'align-justify': {
        const alignIcons: TMetisIcon[] = ALIGN_OPTIONS.map(
          (option) => option.icon,
        )
        if (alignIcons.includes(icon)) {
          const hasAlign = ALIGN_OPTIONS.some((option) =>
            editor?.isActive({ textAlign: option.value }),
          )
          if (isAlignPickerOpen || hasAlign) return true
        }
        break
      }
      default: {
        return false
      }
    }

    return false
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

    // Handle icons with sub-panels.
    if (isIconWithSubPanelActive(icon)) return true

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

  /**
   * Updates the class names and disabled state of toolbar buttons based on the current editor state.
   */
  const updateButtonClassNames = () => {
    bubbleToolbarButtonEngine.buttons.forEach(({ key, icon }) => {
      bubbleToolbarButtonEngine.modifyClassList(key, (classList) =>
        classList.switch('Selected', 'NotSelected', isIconActive(icon)),
      )
      bubbleToolbarButtonEngine.setDisabled(key, isButtonDisabled(icon))
    })
  }

  /**
   * Closes all toolbar sub-panels.
   */
  const closeAllSubPanels = () => {
    setIsColorPickerOpen(false)
    setIsHeadingPickerOpen(false)
    setIsAlignPickerOpen(false)
    setIsLineSpacingPickerOpen(false)
  }

  /**
   * Opens a toolbar sub-panel, closing any other open sub-panel first.
   * If the requested panel is already open, it is closed instead (toggle).
   * @param panel The setter for the sub-panel to open.
   * @param isOpen Whether the sub-panel is currently open.
   */
  const openSubPanel = (
    panel: React.Dispatch<React.SetStateAction<boolean>>,
    isOpen: boolean,
  ) => {
    closeAllSubPanels()
    if (!isOpen) panel(true)
  }

  /**
   * Handles all keyboard shortcuts for the editor and toolbar.
   */
  const handleKeyDownCapture = (event: React.KeyboardEvent) => {
    const modified = event.metaKey || event.ctrlKey
    // Windows reports the shifted character for a letter key while macOS
    // reports the unshifted one, so letters are compared in lower case.
    const pressedLetter = event.key.toLowerCase()
    // The zero key is matched both by its position on the keyboard and by
    // every character it can produce, because holding a modifier can turn it
    // into a different character and the number pad reports itself as a
    // separate key.
    const pressedZero =
      event.code === 'Digit0' ||
      event.code === 'Numpad0' ||
      event.key === '0' ||
      event.key === ')'

    // Enter triggers the bubble menu to appear automatically.
    // @see - Editor.onUpdate()
    if (
      event.key === 'Enter' &&
      !modified &&
      !event.shiftKey &&
      !event.altKey
    ) {
      isCursorOnNewLine.current = true
    }

    // Tab / Shift+Tab — close the bubble menu before focus leaves the editor.
    if (event.key === 'Tab') {
      setIsBubbleMenuForcedOpen(false)
      editor?.commands.setMeta('richTextBubbleMenu', 'hide')
    }

    // Escape priorities:
    // 1. hides toolbar submenus
    // 2. hides toolbar
    if (event.key === 'Escape') {
      if (
        isColorPickerOpen ||
        isHeadingPickerOpen ||
        isAlignPickerOpen ||
        isLineSpacingPickerOpen
      ) {
        event.preventDefault()
        closeAllSubPanels()
      } else {
        event.preventDefault()
        setIsBubbleMenuForcedOpen(false)
        bubbleMenuSuppressedRef.current = true
        editor?.commands.setMeta('richTextBubbleMenu', 'hide')
      }
    }

    // Cmd/Ctrl+K — toggle link.
    if (modified && !event.shiftKey && pressedLetter === 'k') {
      event.preventDefault()
      toggleLink(editor)
    }

    // Cmd+Opt+0 / Ctrl+Alt+0 — clear all formatting.
    if (modified && event.altKey && pressedZero) {
      event.preventDefault()
      editor?.commands.unsetAllMarks()
      editor?.commands.clearNodes()
    }

    // Cmd/Ctrl+Shift+C — cycle font color and open the bubble menu + color picker.
    if (modified && event.shiftKey && pressedLetter === 'c') {
      event.preventDefault()
      cycleColor()
    }

    // Cmd/Ctrl+Shift+H — cycle heading level and open the bubble menu + heading picker.
    if (modified && event.shiftKey && pressedLetter === 'h') {
      event.preventDefault()
      cycleHeading()
    }

    // Cmd/Ctrl+Shift+A — cycle text alignment and open the bubble menu + align picker.
    if (modified && event.shiftKey && pressedLetter === 'a') {
      event.preventDefault()
      cycleAlign()
    }

    // Cmd/Ctrl+Shift+P — cycle line spacing and open the bubble menu + line spacing picker.
    if (modified && event.shiftKey && pressedLetter === 'p') {
      event.preventDefault()
      cycleLineSpacing()
    }

    // Cmd/Ctrl+Shift+M — toggle the bubble menu pinned open at the cursor.
    if (modified && event.shiftKey && pressedLetter === 'm') {
      event.preventDefault()
      if (isBubbleMenuForcedOpen) closeAllSubPanels()
      setIsBubbleMenuForcedOpen((prev) => !prev)
    }
  }

  /**
   * Checks whether the editor is already displaying the given content.
   *
   * A direct comparison is not enough for empty values. An editor with
   * nothing in it reports `<p></p>`, and a value holding nothing but spaces
   * is stored as an empty string, so neither one ever matches an empty
   * incoming value. Anything that displays no readable text is therefore
   * treated as a match for an empty value.
   *
   * @param value The content to compare against.
   */
  const isContentDisplayed = (value: string): boolean => {
    if (!editor) return false
    if (editor.getHTML() === value) return true
    return value === '' && editor.getText().trim() === ''
  }

  /**
   * Determines if the bubble menu toolbar should be shown based on the editor state.
   * @param state The current editor state.
   */
  const shouldShowBubbleMenuToolbar = (state: EditorState): boolean =>
    isBubbleMenuForcedOpen ||
    (!state.selection.empty && !bubbleMenuSuppressedRef.current)

  /**
   * Tells the bubble menu where to appear by returning a fake element whose
   * bounding rect matches the current cursor or selection position.
   *
   * Using the editor's own coordinate system (`{@link Editor.view.coordsAtPos}`)
   * as the primary source avoids a browser quirk where an empty editor returns
   * all-zero coordinates from the native DOM range API, which would place the
   * menu at the top-left corner of the screen. The DOM range rect is still used
   * for the width of a real text selection so the menu centers correctly.
   *
   * When {@link bubbleMenuAnchor} is provided, the menu's vertical position is
   * clamped to help deal with positioning issues such as the editor wrapped in
   * a scrollable container.
   */
  const getBubbleMenuVirtualElement = (): {
    getBoundingClientRect: () => DOMRect
  } | null => {
    if (!editor) return null

    // Use the editor's own coordinate system to locate the start of the cursor
    // or selection. This is the primary position source because the browser's
    // native DOM range API returns all-zero coordinates on an empty editor,
    // which would place the menu at the top-left corner of the screen.
    const { from, to } = editor.state.selection
    const startCoords = editor.view.coordsAtPos(from)
    let left = startCoords.left
    let width = 0

    // When text is selected (not just a cursor), override left and width using
    // the native DOM range rect. This gives a bounding box that spans the full
    // highlighted text so Floating UI can center the menu over the selection.
    if (from !== to) {
      const selection = window.getSelection()
      const boundingBox =
        selection && selection.rangeCount > 0
          ? selection.getRangeAt(0).getBoundingClientRect()
          : null
      if (boundingBox && boundingBox.width > 0) {
        left = boundingBox.left
        width = boundingBox.width
      }
    }

    // If a scrollable container is provided, clamp the vertical position to
    // the container's top edge. Without this, the menu can float above the
    // container and be hidden by its overflow clipping.
    const top = startCoords.top
    const anchor = bubbleMenuAnchor?.current

    if (!anchor) {
      return { getBoundingClientRect: () => new DOMRect(left, top, width, 0) }
    }

    const anchorRect = anchor.getBoundingClientRect()
    const clampedTop = Math.max(top, anchorRect.top)

    return {
      getBoundingClientRect: () => new DOMRect(left, clampedTop, width, 0),
    }
  }

  /* -- EFFECTS -- */

  const editor = useEditor(
    {
      content,
      editable,
      onCreate: ({ editor: newEditor }) => {
        if (editorRef) editorRef.current = newEditor
      },
      onUpdate: (updateProps) => {
        // When the user presses Enter, force the bubble menu open on the
        // new line so they can immediately set formatting if they want.
        if (isCursorOnNewLine.current) {
          isCursorOnNewLine.current = false
          setIsBubbleMenuForcedOpen(true)
        }
        updateButtonClassNames()
        onUpdate?.(updateProps)
      },
      onFocus: (editorFocusProps) => {
        onFocus?.(editorFocusProps)
      },
      onBlur: (editorBlurProps) => {
        closeAllSubPanels()
        setIsBubbleMenuForcedOpen(false)
        bubbleMenuSuppressedRef.current = false
        editorBlurProps.editor.commands.setMeta('richTextBubbleMenu', 'hide')
        onBlur?.(editorBlurProps)
      },
      onSelectionUpdate: () => {
        bubbleMenuSuppressedRef.current = false
        updateButtonClassNames()
      },
      editorProps: {
        attributes: {
          class: 'Editor',
        },
      },
      extensions: [
        StarterKit.configure({
          paragraph: false,
          codeBlock: false,
          link: false,
          // An empty paragraph is kept at the end of the content so there is
          // always a way to move the cursor out of a code block or blockquote
          // that finishes the text. Headings are excluded because they need no
          // escape route, and adding a line after one causes the heading
          // controls to keep applying to that new empty line.
          trailingNode: { notAfter: ['heading'] },
          listItem: {
            HTMLAttributes: {
              class: listClassName,
            },
          },
        }),
        Placeholder.configure({
          placeholder,
        }),
        Link.configure({
          protocols: ['http', 'https'],
          isAllowedUri: (url, { defaultValidate }) => {
            // The "protocols" option above only adds to the extension's
            // built-in list, which also allows mail, telephone, and file
            // transfer addresses. Anything carrying a scheme other than
            // "http" or "https" is rejected here so the editor produces
            // web links only. Addresses written without a scheme, such as
            // "metis.example.com", are still handed to the extension's own
            // check so they keep working.
            const scheme = url.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/)?.[1]
            if (scheme && !['http', 'https'].includes(scheme.toLowerCase())) {
              return false
            }
            return defaultValidate(url)
          },
        }),
        MetisParagraph,
        MetisSpan,
        CodeBlockLowlight.configure({
          lowlight: createLowlight(all),
          defaultLanguage: 'plaintext',
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph', 'codeBlock'],
        }),
        Color,
        LineHeight,
        Markdown,
        TextStyle,
      ],
    },
    // The property is read straight from the props here rather than from the
    // defaulted value. The editor is rebuilt whenever what it is given here
    // changes, and it compares by identity, so an empty array created fresh on
    // each render would rebuild the editor every time and throw away the undo
    // history and the cursor position along with it.
    [props.deps],
  )

  // Handles correct positioning for the bubble menu when any sub-panels
  // open or close. Updates helpers for sub-panel buttons to ensure they're
  // highlighted correctly.
  useEffect(() => {
    updateButtonClassNames()
    editor?.commands.setMeta('richTextBubbleMenu', 'updatePosition')
  }, [
    isColorPickerOpen,
    isHeadingPickerOpen,
    isAlignPickerOpen,
    isLineSpacingPickerOpen,
  ])

  // Shows or hides the bubble menu when the forced-open state changes.
  // We send a separate updatePosition signal in a requestAnimationFrame
  // so the menu is repositioned after the browser has finished painting -
  // without this, the menu appears in the wrong spot on first render.
  useEffect(() => {
    if (isBubbleMenuForcedOpen) {
      editor?.commands.setMeta('richTextBubbleMenu', 'show')

      // We send a separate updatePosition signal in a requestAnimationFrame
      // so the menu is repositioned after the browser has finished painting -
      // without this, the menu appears in the wrong spot on first render.
      requestAnimationFrame(() => {
        editor?.commands.setMeta('richTextBubbleMenu', 'updatePosition')
      })
    } else {
      editor?.commands.setMeta('richTextBubbleMenu', 'hide')
    }
  }, [isBubbleMenuForcedOpen])

  // Sync externally-provided content into the editor when it changes.
  // This is necessary because Tiptap's useEditor only consumes `content`
  // at creation time — subsequent prop changes have no effect on the
  // editor's displayed value without an explicit setContent call.
  // The equality guard prevents a feedback loop with user typing: when
  // the user types, onUpdate sets stateValue to editor.getHTML(), so by
  // the time this effect runs the editor's HTML already matches `content`
  // and setContent is skipped.
  useEffect(() => {
    if (!editor || content === undefined) return
    if (!isContentDisplayed(content)) {
      editor.commands.setContent(content)
    }
  }, [editor, content])

  // Helps dynamically adjust the bubble menu toolbar layout based on
  // container width.
  useResizeObserver(container, (width) => setContainerWidth(width))

  /* -- RENDER -- */
  if (!editor) return null

  return (
    <LocalContextProvider
      context={richTextContext}
      defaultedProps={defaultedProps}
      computed={{ editor }}
      state={state}
      elements={{}}
    >
      <div className={rootClassName} ref={container}>
        <BubbleMenu
          editor={editor}
          className='BubbleToolbar'
          // Used for the various editor setMeta commands that control
          // the bubble menu.
          pluginKey='richTextBubbleMenu'
          shouldShow={({ state }) => shouldShowBubbleMenuToolbar(state)}
          // "appendTo", "placement", and "getReferencedVirtualElement" are used to control
          // where the bubble menu is rendered in the DOM and how it is positioned relative
          // to the editor.
          appendTo={() => document.body}
          options={{ placement: 'top' }}
          getReferencedVirtualElement={getBubbleMenuVirtualElement}
          // Used to prevent the bubble menu from closing when clicking inside it.
          onMouseDown={(e) => e.preventDefault()}
        >
          {editor.isEditable && (
            <>
              <div className='Toolbar' style={toolbarStyle}>
                <ButtonSvgPanel engine={bubbleToolbarButtonEngine} />
                <RichTextColorPicker />
                <RichTextHeadingPicker />
                <RichTextAlignPicker />
                <RichTextLineSpacingPicker />
              </div>
            </>
          )}
        </BubbleMenu>
        <EditorContent
          onKeyDownCapture={handleKeyDownCapture}
          onKeyDown={() => updateButtonClassNames()}
          editor={editor}
        />
      </div>
    </LocalContextProvider>
  )
}

/* -- TYPES -- */

/**
 * Props for `RichText` component.
 */
type TRichText_P = {
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
type TRichTextOptions = {
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
   * the bubble menu's vertical position is clamped to the container's visible
   * top edge so the menu never goes above the visible top edge for times like
   * selecting a large amount of text that has overflowed and scrolled out of view.
   */
  bubbleMenuAnchor?: React.RefObject<HTMLElement | null>
}

/**
 * Computed values derived from props and state for {@link RichText}.
 */
type TRichText_C = {
  /**
   * The Tiptap editor instance.
   */
  editor: Editor
}

/**
 * Consolidated state for {@link RichText}.
 */
type TRichText_S = {
  /**
   * Whether the color picker is open.
   */
  isColorPickerOpen: TReactState<boolean>
  /**
   * Whether the heading picker is open.
   */
  isHeadingPickerOpen: TReactState<boolean>
  /**
   * Whether the text alignment picker is open.
   */
  isAlignPickerOpen: TReactState<boolean>
  /**
   * Whether the line spacing picker is open.
   */
  isLineSpacingPickerOpen: TReactState<boolean>
  /**
   * The width of the container element.
   */
  containerWidth: TReactState<number>
  /**
   * Whether the bubble menu toolbar is forced open at the cursor position
   * even when no text is selected, allowing the user to pre-set formatting.
   */
  isBubbleMenuForcedOpen: TReactState<boolean>
}
