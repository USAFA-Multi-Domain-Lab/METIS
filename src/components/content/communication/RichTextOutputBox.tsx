import { Component } from 'react'
import './RichTextOutputBox.scss'

/**
 * The properties for the RichTextOutputBox component.
 * @interface IRichTextOutputBox
 * @property {string} Element The HTML element (wrapped in a string) to be displayed.
 */
export interface IRichTextOutputBox {
  /**
   * The HTML element (wrapped in a string) to be displayed.
   */
  Element: string
}

/**
 * The state for the RichTextOutputBox component.
 * @interface IRichTextOutputBox_S
 */
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
