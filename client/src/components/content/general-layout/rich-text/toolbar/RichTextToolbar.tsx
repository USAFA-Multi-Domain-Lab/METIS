import { LocalContext, LocalContextProvider } from '@client/context/local'
import { compute } from '@client/toolbox'
import { useResizeObserver } from '@client/toolbox/hooks'
import type { EditorState } from '@tiptap/pm/state'
import { BubbleMenu } from '@tiptap/react/menus'
import { useEffect, useRef, useState } from 'react'
import ButtonSvgPanel from '../../../user-controls/buttons/panels/ButtonSvgPanel'
import { useRichTextContext } from '../RichText'
import {
  RICH_TEXT_TOOLBAR_PLUGIN_KEY,
  useRichTextToolbar,
} from './hooks/useRichTextToolbar'
import './RichTextToolbar.scss'
import RichTextAlignPicker from './subcomponents/RichTextAlignPicker'
import RichTextColorPicker from './subcomponents/RichTextColorPicker'
import RichTextHeadingPicker from './subcomponents/RichTextHeadingPicker'
import RichTextLineSpacingPicker from './subcomponents/RichTextLineSpacingPicker'

/**
 * Local context for the rich text toolbar.
 */
const richTextToolbarContext = new LocalContext<
  {},
  {},
  TRichTextToolbar_S,
  {}
>()

/**
 * Hook used by the toolbar's subcomponents to reach the toolbar's state.
 */
export const useRichTextToolbarContext = richTextToolbarContext.getHook()

/**
 * The floating toolbar for editing rich text.
 */
export default function RichTextToolbar(): TReactElement | null {
  const { editor, elements } = useRichTextContext()

  /* -- STATE -- */

  const state: TRichTextToolbar_S = {
    activePicker: useState<TRichTextPickerKey | null>(null),
    containerWidth: useState<number>(0),
    isPinned: useState<boolean>(false),
  }

  const [activePicker, setActivePicker] = state.activePicker
  const [containerWidth, setContainerWidth] = state.containerWidth
  const [isPinned, setIsPinned] = state.isPinned

  /* -- HOOKS -- */

  const toolbar = useRichTextToolbar({ editor, state })

  /* -- REFS -- */

  // The listeners below are attached once and then left alone, but the toolbar
  // they act on is rebuilt on every render. Going through this ref is what
  // keeps a listener reaching the current toolbar rather than the one it was
  // attached with.
  const latestToolbar = useRef(toolbar)
  latestToolbar.current = toolbar

  /* -- COMPUTED -- */

  /**
   * The CSS styling for the toolbar.
   */
  const style = compute<React.CSSProperties>(() => {
    let style: React.CSSProperties = {}

    // We set the max width here so that the buttons
    // in the toolbar break to a new line when the
    // rich text element's width gets too small.
    if (containerWidth > 0) style.maxWidth = containerWidth

    return style
  })

  /* -- EFFECTS -- */

  // Keeps the toolbar in step with what the editor.
  useEffect(() => {
    const refreshButtons = () => latestToolbar.current.updateButtonClassNames()

    const onSelectionUpdate = () => {
      latestToolbar.current.isSuppressed.current = false
      latestToolbar.current.updateButtonClassNames()
    }

    const onBlur = () => {
      setActivePicker(null)
      setIsPinned(false)
      latestToolbar.current.isSuppressed.current = false
      latestToolbar.current.signal('hide')
    }

    editor.on('update', refreshButtons)
    editor.on('selectionUpdate', onSelectionUpdate)
    editor.on('blur', onBlur)

    return () => {
      editor.off('update', refreshButtons)
      editor.off('selectionUpdate', onSelectionUpdate)
      editor.off('blur', onBlur)
    }
  }, [editor])

  // Keyboard shortcuts
  useEffect(() => {
    const element = editor.view.dom
    const onKeyDownCapture = (event: KeyboardEvent) =>
      latestToolbar.current.handleKeyDown(event)
    const refreshButtons = () => latestToolbar.current.updateButtonClassNames()

    element.addEventListener('keydown', onKeyDownCapture, true)
    element.addEventListener('keydown', refreshButtons)

    return () => {
      element.removeEventListener('keydown', onKeyDownCapture, true)
      element.removeEventListener('keydown', refreshButtons)
    }
  }, [editor])

  // Shows or hides the toolbar as it is held open at the cursor and let go.
  useEffect(() => {
    toolbar.signal(isPinned ? 'show' : 'hide')

    // The reposition is sent in a separate frame so it lands after the
    // browser has finished painting. Without the wait the toolbar appears in
    // the wrong spot the first time it is shown.
    if (isPinned) {
      requestAnimationFrame(() =>
        latestToolbar.current.signal('updatePosition'),
      )
    }
  }, [isPinned])

  // Handles correct positioning for the toolbar when any pickers open or
  // close. Updates helpers for picker buttons to ensure they're highlighted
  // correctly.
  useEffect(() => {
    toolbar.updateButtonClassNames()
    toolbar.signal('updatePosition')
  }, [activePicker])

  // Helps dynamically adjust the toolbar layout based on the width of the
  // rich text element it belongs to.
  useResizeObserver(elements.richTextElement, (width) =>
    setContainerWidth(width),
  )

  /* -- FUNCTIONS -- */

  /**
   * Decides whether the toolbar should be showing.
   * @param editorState The current editor state.
   * @returns `True` when the toolbar should show.
   * @note The editor only asks this when the selection or the text changes, so
   * anything else that should move the toolbar has to say so through
   * {@link TRichTextToolbarControls.signal}.
   */
  const shouldShowToolbar = (editorState: EditorState): boolean =>
    isPinned || (!editorState.selection.empty && !toolbar.isSuppressed.current)

  /**
   * Tells the toolbar where to appear by returning a stand-in element whose
   * bounding rect matches the current cursor or selection position.
   *
   * The editor's own coordinate system is the primary source because the
   * browser's native DOM range API returns all-zero coordinates on an empty
   * editor, which would put the toolbar in the top-left corner of the screen.
   * The DOM range rect is still used for the width of a real text selection
   * so the toolbar centers over it.
   *
   * When an anchor is given, the toolbar's vertical position is held inside
   * it, which is what keeps the toolbar visible when the editor sits in a
   * scrollable container.
   * @param toolbarAnchor A scrollable container the toolbar should stay
   * inside. Handed in at the point the toolbar is placed rather than held
   * here, since nothing else needs it.
   * @returns The stand-in element.
   */
  const getVirtualElement = (
    toolbarAnchor?: React.RefObject<HTMLElement | null>,
  ): { getBoundingClientRect: () => DOMRect } => {
    const { from, to } = editor.state.selection
    const startCoords = editor.view.coordsAtPos(from)
    let left = startCoords.left
    let width = 0

    // When text is selected rather than just a cursor sitting somewhere, the
    // native DOM range rect gives a box spanning the whole highlight, which
    // is what lets the toolbar center over it.
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

    const top = startCoords.top
    const anchor = toolbarAnchor?.current

    if (!anchor) {
      return {
        getBoundingClientRect: () => new DOMRect(left, top, width, 0),
      }
    }

    const anchorRect = anchor.getBoundingClientRect()
    const clampedTop = Math.max(top, anchorRect.top)

    return {
      getBoundingClientRect: () => new DOMRect(left, clampedTop, width, 0),
    }
  }

  /* -- RENDER -- */

  return (
    <LocalContextProvider
      context={richTextToolbarContext}
      defaultedProps={{}}
      computed={{}}
      state={toolbar.state}
      elements={{}}
    >
      <BubbleMenu
        editor={editor}
        className='RichTextToolbar'
        // Used for the various editor setMeta commands that control
        // the toolbar.
        pluginKey={RICH_TEXT_TOOLBAR_PLUGIN_KEY}
        shouldShow={({ state }) => shouldShowToolbar(state)}
        // "appendTo", "placement", and "getReferencedVirtualElement" are used to control
        // where the toolbar is rendered in the DOM and how it is positioned relative
        // to the editor.
        appendTo={() => document.body}
        options={{ placement: 'top' }}
        getReferencedVirtualElement={() =>
          getVirtualElement(elements.toolbarAnchor)
        }
        // Used to prevent the toolbar from closing when clicking inside it.
        onMouseDown={(e) => e.preventDefault()}
      >
        <div className='Tools' style={style}>
          <ButtonSvgPanel engine={toolbar.buttonEngine} />
          <RichTextColorPicker />
          <RichTextHeadingPicker />
          <RichTextAlignPicker />
          <RichTextLineSpacingPicker />
        </div>
      </BubbleMenu>
    </LocalContextProvider>
  )
}

/* -- TYPES -- */

/**
 * The pickers the toolbar can show, one at a time.
 */
export type TRichTextPickerKey = 'color' | 'heading' | 'align' | 'line-spacing'

/**
 * The React state the toolbar and its pickers share.
 */
export type TRichTextToolbar_S = {
  /**
   * Which picker is showing, or null when none is.
   */
  activePicker: TReactState<TRichTextPickerKey | null>
  /**
   * The width of the rich text element the toolbar belongs to, which is what
   * the toolbar and its pickers cap themselves to.
   */
  containerWidth: TReactState<number>
  /**
   * Whether the toolbar is held open at the cursor's location even when no
   * text is selected, which is what lets someone set formatting before typing.
   */
  isPinned: TReactState<boolean>
}
