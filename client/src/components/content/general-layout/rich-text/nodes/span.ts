import { Node } from '@tiptap/core'

/**
 * Span-element node for the editor.
 */
const MetisSpan = Node.create({
  name: 'span',
  group: 'inline',
  content: 'inline*',
  inline: true,
  parseHTML() {
    return [
      {
        tag: 'span',
      },
    ]
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0]
  },
  addAttributes() {
    return {
      class: {
        default: null,
      },
      // Add other attributes as needed
    }
  },
})

export default MetisSpan
