import { Mark, mergeAttributes } from '@tiptap/core'

/**
 * Span-element extension for the editor.
 *
 * Implemented as a Mark (not a Node) so it coexists with the TextStyle mark
 * on the same text node rather than producing nested `<span>` elements.
 * Matches only `<span class="...">` so it never interferes with the plain
 * `<span style="...">` wrappers that TextStyle / Color create.
 */
const MetisSpan = Mark.create({
  name: 'metisSpan',

  addAttributes() {
    return {
      class: {
        default: null,
        parseHTML: (element) => element.getAttribute('class'),
        renderHTML: (attributes) => {
          if (!attributes.class) return {}
          return { class: attributes.class }
        },
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[class]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0]
  },
})

export default MetisSpan
