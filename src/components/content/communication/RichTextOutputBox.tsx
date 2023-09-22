import { Component } from 'react'
import './RichTextOutputBox.scss'

export interface IRichTextOutputBox {
  Element: string
}

export interface IRichTextOutputBox_S {}

/**
 * This component is responsible for displaying
 * rich text in the application.
 * @extends {Component<IRichTextOutputBox, IRichTextOutputBox_S>}
 */
export default class RichTextOutputBox extends Component<
  IRichTextOutputBox,
  IRichTextOutputBox_S
> {
  render(): JSX.Element {
    let Element: string = this.props.Element

    return (
      <div
        className='RichTextOutputBox'
        dangerouslySetInnerHTML={{ __html: Element }}
      ></div>
    )
  }
}
