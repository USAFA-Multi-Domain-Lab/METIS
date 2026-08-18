/**
 * Utility class for handling rich text formatting.
 */
export class RichTextToolbox {
  /**
   * Ends the current line and starts a new one inside the same paragraph,
   * rendering as a `<br>` HTML element.
   * @note Equivalent to pressing `shift+return` in an editor.
   * @example
   * `**Undo**${RichTextToolbox.MARKDOWN_LINE_BREAK}\`ctrl+z\``
   *
   * // Renders similarly to:
   * <p>
   *  <strong>Undo</strong>
   *  <br>
   *  <code>ctrl+z</code>
   * </p>
   */
  public static readonly MARKDOWN_LINE_BREAK: string = '\n'

  /**
   * Ends the current paragraph and starts a new one, leaving an empty
   * paragraph between the two so they are separated by a visible gap. Each
   * paragraph renders as its own `<p>` HTML element.
   * @note Equivalent to pressing `return` twice in an editor.
   * @example
   * `Regular text${RichTextToolbox.MARKDOWN_PARAGRAPH_BREAK}**Followed by a new paragraph with bold text**`
   *
   * // Renders similarly to:
   * <p>Regular text</p>
   * <p><br></p>
   * <p><strong>Followed by a new paragraph with bold text</strong></p>
   */
  public static readonly MARKDOWN_PARAGRAPH_BREAK: string = '\n\n\n\n'
}
