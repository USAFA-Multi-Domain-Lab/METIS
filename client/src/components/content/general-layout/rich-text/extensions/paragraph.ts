import Paragraph from '@tiptap/extension-paragraph'

/**
 * Custom paragraph extension for the rich-text editor.
 */
const MetisParagraph = Paragraph.extend({
  addAttributes() {
    return {
      class: {
        default: null,
        parseHTML: (element) => element.getAttribute('class') || null,
        renderHTML: (attributes) => {
          return attributes.class ? { class: attributes.class } : {}
        },
      },
    }
  },
})

export default MetisParagraph
