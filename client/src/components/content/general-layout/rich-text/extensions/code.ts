import Code from '@tiptap/extension-code'
import type { MarkType, ResolvedPos } from '@tiptap/pm/model'
import { Mark } from '@tiptap/pm/model'
import type { EditorState, Transaction } from '@tiptap/pm/state'
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

/**
 * Inline code for the rich-text editor. At each edge of a piece of inline
 * code, the caret has two positions, one inside the code and one outside
 * it. Text typed inside joins the code, and text typed outside does not.
 * The left and right arrow keys step between the two positions before they
 * move the caret, and the caret is drawn on the side it is on.
 */
const MetisCode = Code.extend({
  // TipTap leaves code at the end of a line by inserting a space, which
  // the arrow handling below replaces.
  exitable: false,

  addKeyboardShortcuts() {
    return {
      ...this.parent?.(),
      ArrowLeft: () => {
        return handleArrowLeft(
          this.editor.state,
          this.editor.view.dispatch,
          this.type,
        )
      },
      ArrowRight: () => {
        return handleArrowRight(
          this.editor.state,
          this.editor.view.dispatch,
          this.type,
        )
      },
    }
  },

  addProseMirrorPlugins() {
    let codeType = this.type

    return [
      ...(this.parent?.() ?? []),
      new Plugin({
        key: CODE_CARET_KEY,
        props: {
          decorations: (state) => {
            let caret = findCodeCaret(state, codeType)
            if (!caret) return null

            let widget = Decoration.widget(caret.position, createCaretElement, {
              key: `code-caret-${caret.inside}`,
              side: caret.side,
              marks: caret.marks,
            })
            return DecorationSet.create(state.doc, [widget])
          },
          attributes: (state): Record<string, string> => {
            let caret = findCodeCaret(state, codeType)
            return caret ? { class: 'CodeEdgeCaret' } : {}
          },
        },
      }),
    ]
  },
})

/**
 * Identifies the plugin that draws the caret at the edges of inline code.
 */
const CODE_CARET_KEY = new PluginKey('metisCodeCaret')

/**
 * Finds which edge of a piece of inline code a position sits on.
 * @param position The position to check.
 * @param codeType The inline code mark type.
 * @returns `'start'` when code begins right after the position, `'end'`
 * when code ends right before it, or `null` when it is at neither.
 */
function findCodeEdge(
  position: ResolvedPos,
  codeType: MarkType,
): TCodeEdge | null {
  let codeBefore =
    !!position.nodeBefore && !!codeType.isInSet(position.nodeBefore.marks)
  let codeAfter =
    !!position.nodeAfter && !!codeType.isInSet(position.nodeAfter.marks)

  if (codeAfter && !codeBefore) return 'start'
  if (codeBefore && !codeAfter) return 'end'
  return null
}

/**
 * The marks text typed at a code edge would get on either side of it.
 * @param position A position on a code edge.
 * @param edge Which edge of the code the position is on.
 * @param inside Whether to get the marks for inside the code.
 * @returns The marks of the text on that side, or none when there is no
 * text there, such as outside code that starts a line.
 */
function getEdgeMarks(
  position: ResolvedPos,
  edge: TCodeEdge,
  inside: boolean,
): readonly Mark[] {
  let codeSide = edge === 'start' ? position.nodeAfter : position.nodeBefore
  let otherSide = edge === 'start' ? position.nodeBefore : position.nodeAfter
  let side = inside ? codeSide : otherSide
  return side?.marks ?? Mark.none
}

/**
 * @param state The editor state.
 * @param codeType The inline code mark type.
 * @returns Whether text typed at the caret would be inline code.
 */
function isInsideCode(state: EditorState, codeType: MarkType): boolean {
  let marks = state.storedMarks ?? state.selection.$from.marks()
  return !!codeType.isInSet(marks)
}

/**
 * Finds where to draw the caret when it is on a code edge.
 * @param state The editor state.
 * @param codeType The inline code mark type.
 * @returns Where and how to draw the caret, or `null` when the selection
 * is not an empty one on a code edge.
 */
function findCodeCaret(
  state: EditorState,
  codeType: MarkType,
): TCodeCaret | null {
  let { selection } = state
  if (!selection.empty) return null

  let position = selection.$from
  let edge = findCodeEdge(position, codeType)
  if (!edge) return null

  let inside = isInsideCode(state, codeType)
  let besideCode = edge === 'start' ? 1 : -1
  let side = inside ? besideCode : -besideCode
  let marks = getEdgeMarks(position, edge, inside)

  return { position: position.pos, inside, side, marks }
}

/**
 * Creates the element drawn as the caret on a code edge.
 */
function createCaretElement(): HTMLElement {
  let element = document.createElement('span')
  element.className = 'CodeCaret'
  return element
}

/**
 * Moves the caret to the given side of the code edge it is on, without
 * moving its position.
 * @param state The editor state.
 * @param dispatch Dispatches the transaction.
 * @param edge Which edge of the code the caret is on.
 * @param inside Whether to move the caret inside the code.
 */
function switchCodeSide(
  state: EditorState,
  dispatch: (transaction: Transaction) => void,
  edge: TCodeEdge,
  inside: boolean,
): void {
  let marks = getEdgeMarks(state.selection.$from, edge, inside)
  dispatch(state.tr.setStoredMarks(marks))
}

/**
 * Handles the left arrow. At the start of code it steps out of the code,
 * and at the end of code it steps into it. A move onto a code edge lands
 * on the side the caret came from.
 * @returns Whether the key press was handled.
 */
function handleArrowLeft(
  state: EditorState,
  dispatch: (transaction: Transaction) => void,
  codeType: MarkType,
): boolean {
  let { selection } = state
  if (!selection.empty) return false

  let position = selection.$from
  let edge = findCodeEdge(position, codeType)
  let inside = isInsideCode(state, codeType)

  if (edge === 'start' && inside) {
    switchCodeSide(state, dispatch, edge, false)
    return true
  }
  if (edge === 'end' && !inside) {
    switchCodeSide(state, dispatch, edge, true)
    return true
  }

  // Moving left onto a code edge would otherwise land on the side of the
  // text before it, not the side the caret came from.
  let canStepLeft = position.parentOffset > 0 && !!position.nodeBefore?.isText
  if (!canStepLeft) return false
  let target = state.doc.resolve(position.pos - 1)
  let targetEdge = findCodeEdge(target, codeType)
  if (!targetEdge) return false

  let targetMarks = target.nodeAfter?.marks ?? Mark.none
  let transaction = state.tr
    .setSelection(TextSelection.create(state.doc, target.pos))
    .setStoredMarks(targetMarks)
    .scrollIntoView()
  dispatch(transaction)
  return true
}

/**
 * Handles the right arrow. At the end of code it steps out of the code,
 * and at the start of code it steps into it.
 * @returns Whether the key press was handled.
 */
function handleArrowRight(
  state: EditorState,
  dispatch: (transaction: Transaction) => void,
  codeType: MarkType,
): boolean {
  let { selection } = state
  if (!selection.empty) return false

  let position = selection.$from
  let edge = findCodeEdge(position, codeType)
  let inside = isInsideCode(state, codeType)

  if (edge === 'end' && inside) {
    switchCodeSide(state, dispatch, edge, false)
    return true
  }
  if (edge === 'start' && !inside) {
    switchCodeSide(state, dispatch, edge, true)
    return true
  }

  // A move right lands on the side of the text it crossed, which is
  // already the side the caret came from.
  return false
}

export default MetisCode

/* -- TYPES -- */

/**
 * An edge of a piece of inline code.
 */
type TCodeEdge = 'start' | 'end'

/**
 * Where and how to draw the caret on a code edge.
 */
type TCodeCaret = {
  /**
   * The document position of the caret.
   */
  position: number
  /**
   * Whether the caret is inside the code.
   */
  inside: boolean
  /**
   * Which side of the position the caret is drawn on, as a widget
   * decoration's `side`.
   */
  side: number
  /**
   * The marks to draw around the caret, which place it inside or outside
   * the code element.
   */
  marks: readonly Mark[]
}
