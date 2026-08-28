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
})
