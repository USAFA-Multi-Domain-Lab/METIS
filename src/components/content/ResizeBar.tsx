import React from 'react'

import './ResizeBar.scss'

interface IResizeBar {
  target1: React.RefObject<HTMLElement>
  target2: React.RefObject<HTMLElement>
}

interface IResizeBar_S {}

// Responsible for resizing between two panels.
export class ResizeBar extends React.Component<IResizeBar, IResizeBar_S> {
  resizeBar_ref: React.RefObject<HTMLDivElement> = React.createRef()

  // inherited
  state: IResizeBar_S = {}

  constructor(props: IResizeBar) {
    super(props)
  }

  // inherited
  componentDidMount(): void {
    let resizeBar_elm: HTMLDivElement | null = this.resizeBar_ref.current
    let target1_elm: HTMLElement | null = this.props.target1.current
    let target2_elm: HTMLElement | null = this.props.target2.current

    if (
      resizeBar_elm &&
      target1_elm &&
      target2_elm &&
      resizeBar_elm.parentNode &&
      target1_elm.parentNode &&
      target2_elm.parentNode
    ) {
      if (
        !resizeBar_elm.parentNode.isEqualNode(target1_elm.parentNode) ||
        !resizeBar_elm.parentNode.isEqualNode(target2_elm.parentNode)
      ) {
        throw new Error(
          'Resize bar does not share the same parent as target 1 and target 2.',
        )
      }

      let parentNode: HTMLElement = resizeBar_elm.parentNode as HTMLElement

      let resizeBar_index = Array.prototype.indexOf.call(
        resizeBar_elm.parentNode.childNodes,
        parentNode,
      )
      let target1_index = Array.prototype.indexOf.call(
        target1_elm.parentNode.childNodes,
        parentNode,
      )
      let target2_index = Array.prototype.indexOf.call(
        target2_elm.parentNode.childNodes,
        parentNode,
      )

      console.log(target1_index, target2_index, resizeBar_index)

      if (
        !(resizeBar_index > target1_index) ||
        !(resizeBar_index < target2_index)
      ) {
        throw new Error('Resize bar is not between target 1 and target 2.')
      }
    }
  }

  // inherited
  render(): JSX.Element | null {
    let className: string = 'ResizeBar'

    return <div className={className} ref={this.resizeBar_ref}></div>
  }
}
