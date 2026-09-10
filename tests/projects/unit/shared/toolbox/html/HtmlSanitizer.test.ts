import { describe, expect, test } from '@jest/globals'
import { HtmlSanitizer } from '@shared/toolbox/html/HtmlSanitizer'

describe('HtmlSanitizer', () => {
  test('Removes a script element along with the text inside it', () => {
    const result = HtmlSanitizer.sanitize(
      '<p>Before</p><script>alert("xss")</script><p>After</p>',
    )
    expect(result).toBe('<p>Before</p><p>After</p>')
    expect(result).not.toContain('alert')
  })

  test('Removes an iframe along with the text inside it', () => {
    const result = HtmlSanitizer.sanitize(
      '<p>Before</p><iframe src="https://example.com">Fallback</iframe><p>After</p>',
    )
    expect(result).toBe('<p>Before</p><p>After</p>')
    expect(result).not.toContain('Fallback')
    expect(result).not.toContain('example.com')
  })

  test('Drops an event handler attribute but keeps the element and its text', () => {
    const result = HtmlSanitizer.sanitize(
      '<p onclick="alert(\'xss\')">Click me</p>',
    )
    expect(result).toBe('<p>Click me</p>')
    expect(result).not.toContain('onclick')
  })

  test('Does not let a javascript: URL survive on an href', () => {
    const result = HtmlSanitizer.sanitize(
      '<a href="javascript:alert(\'xss\')">Link text</a>',
    )
    expect(result).not.toContain('javascript:')
    expect(result).toContain('Link text')
  })

  test('Leaves everything the rich text editor produces recognizable', () => {
    const editorOutput =
      '<h2>Heading</h2>' +
      '<p><strong>Bold</strong> and <em>italic</em> and <u>underlined</u>.</p>' +
      '<ul><li><p>First item</p></li><li><p>Second item</p></li></ul>' +
      '<ol><li><p>Step one</p></li></ol>' +
      '<blockquote><p>Quoted</p></blockquote>' +
      '<p><a href="https://example.com" target="_blank" rel="noopener">A link</a></p>' +
      '<p><span style="color: #52b1ff">Coloured</span></p>'

    const result = HtmlSanitizer.sanitize(editorOutput)

    // Every element the editor wrote is still there.
    for (const element of [
      '<h2>',
      '<strong>',
      '<em>',
      '<u>',
      '<ul>',
      '<ol>',
      '<li>',
      '<blockquote>',
      '<a ',
      '<span ',
    ]) {
      expect(result).toContain(element)
    }

    // So are the attributes on the allow-list.
    expect(result).toContain('href="https://example.com"')
    expect(result).toContain('target="_blank"')
    expect(result).toContain('rel="noopener"')
    expect(result).toContain('style="color: #52b1ff"')

    // Nothing the author wrote was dropped, and sanitizing what came back
    // changes nothing further.
    expect(result).toContain('First item')
    expect(result).toContain('Step one')
    expect(result).toContain('Quoted')
    expect(HtmlSanitizer.sanitize(result)).toBe(result)
  })

  test('Removes a declaration naming a resource and keeps the allowed ones beside it', () => {
    const result = HtmlSanitizer.sanitize(
      '<p style="color: red; background: url(https://example.test/x.png); text-align: center">Message</p>',
    )
    expect(result).toBe('<p style="color: red; text-align: center;">Message</p>')
    expect(result).not.toContain('example.test')
  })

  test('Removes a declaration that positions an element', () => {
    const result = HtmlSanitizer.sanitize(
      '<span style="position: fixed; z-index: 9999; color: red">Text</span>',
    )
    expect(result).toBe('<span style="color: red;">Text</span>')
    expect(result).not.toContain('position')
    expect(result).not.toContain('z-index')
  })

  test('Leaves an attribute holding only color, line height, and alignment as written', () => {
    const styled =
      '<span style="color: #52b1ff; line-height: 2; text-align: center">Text</span>'

    expect(HtmlSanitizer.sanitize(styled)).toBe(styled)
  })

  test('Removes the style attribute entirely when nothing in it is allowed', () => {
    const result = HtmlSanitizer.sanitize(
      '<span style="position: fixed; z-index: 9999">Text</span>',
    )
    expect(result).toBe('<span>Text</span>')
    expect(result).not.toContain('style')
  })

  // The filter reads the longhands a shorthand expands into rather than the
  // shorthand itself, so this covers "background", whose every expansion is
  // disallowed. A shorthand expanding into an allowed property keeps that
  // piece: "font: 12px/2 serif" leaves its line height behind.
  test('Removes a shorthand along with every property it expands into', () => {
    const result = HtmlSanitizer.sanitize(
      '<p style="background: url(https://example.test/x.png); color: red">Text</p>',
    )
    expect(result).toBe('<p style="color: red;">Text</p>')
    expect(result).not.toContain('background')
  })

  // Appended by the review to pin Medium #1. Expected to fail until the
  // finding is closed: a declaration the CSS parser cannot parse never
  // reaches the filter, so it stays in the attribute as written. The
  // background shorthand fails to parse once it carries a position; the
  // vendor-prefixed property is not implemented at all.
  test('Removes a declaration the CSS parser does not recognize', () => {
    const positioned = HtmlSanitizer.sanitize(
      '<p style="background: url(https://example.test/x.png) no-repeat left top; color: red">Text</p>',
    )
    expect(positioned).toBe('<p style="color: red;">Text</p>')

    const prefixed = HtmlSanitizer.sanitize(
      '<span style="-webkit-mask-image: url(https://example.test/x.png); color: red">Text</span>',
    )
    expect(prefixed).not.toContain('-webkit-mask-image')
    expect(prefixed).not.toContain('example.test')
  })
})
