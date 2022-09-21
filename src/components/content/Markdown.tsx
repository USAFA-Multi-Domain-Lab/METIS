// -- script-imports --

import React from 'react'
import parse from 'marked'
import './Markdown.scss'

// -- style-imports --

// -- interfaces --

export interface IMarkdown_P {
  markdown: any
  theme: MarkdownTheme
  lineDivider: string
}

interface IMarkdown_S {}

// -- enumerations --

// represents a theme for the
// rendered markdown to use,
// changing various colors based
// on the theme that is selected
export enum MarkdownTheme {
  ThemePrimary,
  ThemeSecondary,
  ThemeTertiary,
}

// -- classes --

// a component that takes in
// markdown and renders it into
// html
export default class Markdown extends React.Component<
  IMarkdown_P,
  IMarkdown_S
> {
  // -- static-fields --

  // inherited
  static defaultProps = {
    lineDivider: '\n',
  }

  // the 'marked' dependency doesn't
  // handle code blocks, this does
  static generateCodeBlocks(markdown: string): string {
    let codeBlocks = markdown.split('```')
    while (codeBlocks.length >= 3) {
      markdown = markdown.replace('```', '<code class="code-block">')
      markdown = markdown.replace('```', '</code>')
      codeBlocks.shift()
      codeBlocks.shift()
    }
    let maxSpaceCount: number = 2
    while (markdown.includes(' '.repeat(maxSpaceCount + 1))) {
      maxSpaceCount++
    }
    let cursor: number = maxSpaceCount
    while (cursor > 1) {
      let spaces: string = ' '.repeat(cursor)
      markdown = markdown.replaceAll(
        spaces,
        `<span>${'&nbsp;'.repeat(cursor)}</span>`,
      )
      cursor--
    }
    markdown = markdown.replaceAll('\n ', '\n<span>&nbsp;</span>')
    return markdown
  }

  // turns tabs in the provided text
  // into something that actually
  // provides spacing in the rendered
  // html
  static generateIndentations(markdown: string): string {
    markdown = markdown.replaceAll('\t', '<span class="indentation"></span>')
    return markdown
  }

  // takes markdown, whether the markdown
  // has multiple lines, and what value
  // is used in the markdown to divide
  // the lines and returns the generated
  // html
  static parseHtml(
    markdown: string | null,
    lineDivider: string = '\n',
  ): string {
    let html = ''
    if (markdown) {
      markdown = Markdown.generateCodeBlocks(markdown)
      markdown = Markdown.generateIndentations(markdown)
      // then splits the markdown by the divider and parses each generated
      // value representing a line
      let lines: string[] = markdown.split(lineDivider)
      for (let line of lines) {
        if (line === '' || line === ' ') {
          html += '<p></p>'
        } else {
          let parsedLine = parse(line)
          html += `${parsedLine}`
        }
      }
    }
    return html
  }

  // -- properties --

  state: IMarkdown_S
  root: React.RefObject<HTMLDivElement>

  /* -- initialization -- */

  constructor(props: IMarkdown_P) {
    super(props)
    this.state = {}
    this.root = React.createRef()
  }

  // -- functions | state-purposed --

  // inherited
  componentDidMount(): void {
    this.parseAndRenderMarkdown()
  }

  // inherited
  componentDidUpdate(previousProps: IMarkdown_P): void {
    if (this.props.markdown !== previousProps.markdown) {
      this.parseAndRenderMarkdown()
    }
  }

  // -- functions | render --

  // grabs the markdown from the props, parses the
  // html, and sets the inner html of the root
  // element
  parseAndRenderMarkdown() {
    let root: HTMLDivElement | null = this.root.current
    if (root) {
      let markdown: string = this.props.markdown
      let lineDivider: string = this.props.lineDivider
      let html: string = Markdown.parseHtml(markdown, lineDivider)
      root.innerHTML = html
      // post-render
      let anchorElements: NodeListOf<HTMLAnchorElement> =
        root.querySelectorAll('a')
      for (let index: number = 0; index < anchorElements.length; index++) {
        let anchorElement: HTMLAnchorElement = anchorElements[index]
        anchorElement.target = '_blank'
        anchorElement.rel = 'noreferrer'
      }
    }
  }

  // inherited
  render() {
    let theme: MarkdownTheme = this.props.theme
    let className: string = 'Markdown'
    className +=
      theme === MarkdownTheme.ThemePrimary
        ? ' theme-primary'
        : ' theme-secondary'
    return <div className={className} ref={this.root}></div>
  }
}
