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
   * The elements that are removed along with everything inside them. They are
   * already absent from the allowed elements, and naming them here means the
   * text they carry is thrown away instead of being displayed on its own.
   */
  public static readonly FORBIDDEN_ELEMENTS: string[] = ['script', 'iframe']

  /**
   * Sanitizes HTML so it is safe to display.
   * @param html The HTML to sanitize.
   * @returns The same HTML with everything outside the allowed elements and
   * attributes removed.
   */
  public static sanitize(html: string): string {
    // todo: evaluate any security vulnerabilities
    // todo: for the addition of "span" and "style."
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: HtmlSanitizer.ALLOWED_ELEMENTS,
      ALLOWED_ATTR: HtmlSanitizer.ALLOWED_ATTRIBUTES,
      FORBID_TAGS: HtmlSanitizer.FORBIDDEN_ELEMENTS,
    })
  }
}
