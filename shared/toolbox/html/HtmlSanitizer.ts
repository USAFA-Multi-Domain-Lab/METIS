import DOMPurify from 'isomorphic-dompurify'

/**
 * Strips anything out of a piece of HTML that could run code or reach outside
 * the page, leaving only the elements and attributes that the rich text
 * editor writes.
 */
export class HtmlSanitizer {
  /**
   * The elements that are kept. An element that is not on this list is
   * removed, while the text inside it stays.
   */
  public static readonly ALLOWED_ELEMENTS: string[] = [
    'a',
    'br',
    'p',
    'strong',
    'b',
    'em',
    'i',
    'u',
    'ul',
    'ol',
    'li',
    'code',
    'pre',
    'hr',
    'blockquote',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    's',
    'del',
    'strike',
    'span',
  ]

  /**
   * The attributes that are kept. Every other attribute is dropped, which is
   * what removes the event handlers, such as "onerror" and "onclick", that
   * would otherwise run code when an element is displayed or interacted with.
   */
  public static readonly ALLOWED_ATTRIBUTES: string[] = [
    'href',
    'rel',
    'target',
    'class',
    'style',
    'start',
    'type',
  ]

  /**
   * The style properties that are kept. Every other declaration is dropped
   * from a "style" attribute.
   *
   * A property belongs here only when it can neither name a resource nor move
   * an element. One that takes a "url()", such as "background" or
   * "list-style-image", would let an imported mission file pull from another
   * site when the message is displayed, and one that affects position or
   * stacking, such as "position" or "z-index", would let it cover the page.
   */
  public static readonly ALLOWED_STYLE_PROPERTIES: string[] = [
    'color',
    'line-height',
    'text-align',
  ]

  /**
   * Sanitizes HTML so it is safe to display.
   * @param html The HTML to sanitize.
   * @returns The same HTML with everything outside the allowed elements and
   * attributes removed.
   */
  public static sanitize(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: HtmlSanitizer.ALLOWED_ELEMENTS,
      ALLOWED_ATTR: HtmlSanitizer.ALLOWED_ATTRIBUTES,
    })
  }
}

// DOMPurify has no option for limiting a "style" attribute to particular
// properties, so this trims one after DOMPurify has cleaned the element.
// DOMPurify holds its hooks itself rather than taking them per call, so
// registering here covers every sanitize made in this process.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  const element = node as HTMLElement

  if (typeof element.getAttribute !== 'function' || !element.style) return
  if (!element.getAttribute('style')) return

  const disallowed = Array.from(element.style).filter(
    (property) => !HtmlSanitizer.ALLOWED_STYLE_PROPERTIES.includes(property),
  )

  // Changing the attribute reformats everything left in it, so one with
  // nothing to lose is left exactly as it was written.
  if (disallowed.length === 0) return

  for (const property of disallowed) element.style.removeProperty(property)
  if (!element.getAttribute('style')) element.removeAttribute('style')
})
