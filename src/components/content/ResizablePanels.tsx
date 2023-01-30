import React from 'react'

import './ResizablePanels.scss'

// Settings to control how the panels
// are sized.
export enum EPanelSizingMode {
  Panel1_Auto__Panel2_Defined,
  Panel1_Defined__Panel2_Auto,
}

interface IResizablePanel {
  minSize: number /*px*/
  render: () => JSX.Element | null
}

interface IResizablePanel_S {}

// A panel that can be used in a panel size
// relationship to allow for resizing between
// it and another panel.
export class ResizablePanel extends React.Component<
  IResizablePanel,
  IResizablePanel_S
> {
  // inherited
  static defaultProps = {
    minSize: 200,
  }

  // inherited
  state: IResizablePanel_S = {}

  constructor(props: IResizablePanel) {
    super(props)
  }

  // inherited
  render(): JSX.Element | null {
    let className: string = 'ResizablePanel'
    let style: React.CSSProperties = {
      minWidth: `${this.props.minSize}px`,
    }

    return (
      <div className={className} style={style}>
        {this.props.render()}
      </div>
    )
  }
}

interface IPanelSizeRelationship {
  panel1: IResizablePanel
  panel2: IResizablePanel
  sizingMode: EPanelSizingMode
  initialDefinedSize: number /*px*/
}

interface IPanelSizeRelationship_S {
  isDragging: boolean
  definedSize: number /*px*/
  previousWindowWidth: number /*px*/
}

// Responsible for resizing between two panels.
export class PanelSizeRelationship extends React.Component<
  IPanelSizeRelationship,
  IPanelSizeRelationship_S
> {
  static RESIZE_BAR_WIDTH: number = 10 /*px*/

  panelSizeRelationship_ref: React.RefObject<HTMLDivElement> = React.createRef()
  resizeBar_ref: React.RefObject<HTMLDivElement> = React.createRef()

  // inherited
  state: IPanelSizeRelationship_S

  constructor(props: IPanelSizeRelationship) {
    super(props)

    this.state = {
      isDragging: false,
      definedSize: props.initialDefinedSize,
      previousWindowWidth: window.innerWidth,
    }
  }

  // inherited
  componentDidMount(): void {
    window.addEventListener('mousemove', this.handleWindowMouseMove)
    window.addEventListener('mouseup', this.handleWindowMouseUp)
    window.addEventListener('resize', this.handleWindowResize)

    this.setState({ previousWindowWidth: window.innerWidth })
  }

  // inherited
  componentWillUnmount(): void {
    window.removeEventListener('mousemove', this.handleWindowMouseMove)
    window.removeEventListener('mouseup', this.handleWindowMouseUp)
    window.removeEventListener('resize', this.handleWindowResize)
  }

  handleDragStart = (): void => {
    this.setState({ isDragging: true })
  }

  handleDragEnd = (): void => {
    this.setState({ isDragging: false })
  }

  handleWindowMouseMove = (event: MouseEvent): void => {
    let panelSizeRelationship_elm: HTMLDivElement | null =
      this.panelSizeRelationship_ref.current
    let resizeBar_elm: HTMLDivElement | null = this.resizeBar_ref.current
    let isDragging: boolean = this.state.isDragging

    if (panelSizeRelationship_elm && resizeBar_elm && isDragging) {
      let panel1: IResizablePanel = this.props.panel1
      let panel2: IResizablePanel = this.props.panel2
      let relationshipWidth: number = panelSizeRelationship_elm.offsetWidth
      let resizeBarWidth: number = PanelSizeRelationship.RESIZE_BAR_WIDTH
      let definedSize: number = this.state.definedSize
      let resizeBarX: number = resizeBar_elm.offsetLeft
      let mouseX: number = event.clientX
      let deltaX: number = mouseX - resizeBarX

      if (deltaX > 0) {
        deltaX = Math.max(0, deltaX - resizeBarWidth)
      }

      switch (this.props.sizingMode) {
        case EPanelSizingMode.Panel1_Auto__Panel2_Defined:
          definedSize -= deltaX

          if (definedSize < panel2.minSize) {
            definedSize = panel2.minSize
          } else if (
            definedSize >
            relationshipWidth - resizeBarWidth - panel1.minSize
          ) {
            definedSize = relationshipWidth - resizeBarWidth - panel1.minSize
          }
          break
        case EPanelSizingMode.Panel1_Defined__Panel2_Auto:
          definedSize += deltaX

          if (definedSize < panel1.minSize) {
            definedSize = panel1.minSize
          } else if (
            definedSize >
            relationshipWidth - resizeBarWidth - panel2.minSize
          ) {
            definedSize = relationshipWidth - resizeBarWidth - panel2.minSize
          }
          break
      }

      this.setState({ definedSize })
    }
  }

  handleWindowResize = (event: UIEvent): void => {
    let panelSizeRelationship_elm: HTMLDivElement | null =
      this.panelSizeRelationship_ref.current

    if (panelSizeRelationship_elm) {
      let currentWindowWidth: number = window.innerWidth
      let previousWindowWidth: number = this.state.previousWindowWidth
      let panel1: IResizablePanel = this.props.panel1
      let panel2: IResizablePanel = this.props.panel2
      let sizingMode: EPanelSizingMode = this.props.sizingMode
      let relationshipWidth: number = panelSizeRelationship_elm.offsetWidth
      let resizeBarWidth: number = PanelSizeRelationship.RESIZE_BAR_WIDTH
      let deltaWindowWidth: number = currentWindowWidth - previousWindowWidth
      let definedSize: number = this.state.definedSize
      let previousAutoSize: number =
        relationshipWidth - resizeBarWidth - definedSize
      let currentAutoSize: number = previousAutoSize + deltaWindowWidth
      let undersizedAmount: number = 0

      switch (sizingMode) {
        case EPanelSizingMode.Panel1_Auto__Panel2_Defined:
          if (currentAutoSize < panel1.minSize) {
            undersizedAmount = panel1.minSize - currentAutoSize
            definedSize -= undersizedAmount

            if (definedSize < panel2.minSize) {
              definedSize = panel2.minSize
            }
          }
          break
        case EPanelSizingMode.Panel1_Defined__Panel2_Auto:
          if (currentAutoSize < panel2.minSize) {
            undersizedAmount = panel2.minSize - currentAutoSize
            definedSize -= undersizedAmount

            if (definedSize < panel1.minSize) {
              definedSize = panel1.minSize
            }
          }
      }

      this.setState({ definedSize, previousWindowWidth: window.innerWidth })
    }
  }

  handleWindowMouseUp = (): void => {
    this.handleDragEnd()
  }

  // inherited
  render(): JSX.Element | null {
    let panel1: IResizablePanel = this.props.panel1
    let panel2: IResizablePanel = this.props.panel2
    let isDragging: boolean = this.state.isDragging
    let definedSize: number = this.state.definedSize
    let panel1GridTemplateColumn: string = ''
    let panel2GridTemplateColumn: string = ''
    let className: string = 'PanelSizeRelationship'
    let resizeBarClassName: string = 'ResizeBar'
    let style: React.CSSProperties = {}

    if (isDragging) {
      resizeBarClassName += ' IsDragging'
    }

    switch (this.props.sizingMode) {
      case EPanelSizingMode.Panel1_Auto__Panel2_Defined:
        panel1GridTemplateColumn = 'auto'
        panel2GridTemplateColumn = `${definedSize}px`
        break
      case EPanelSizingMode.Panel1_Defined__Panel2_Auto:
        panel1GridTemplateColumn = `${definedSize}px`
        panel2GridTemplateColumn = 'auto'
        break
    }

    style.gridTemplateColumns = `${panel1GridTemplateColumn} ${PanelSizeRelationship.RESIZE_BAR_WIDTH}px ${panel2GridTemplateColumn}`

    return (
      <div
        className={className}
        ref={this.panelSizeRelationship_ref}
        style={style}
      >
        <ResizablePanel {...panel1} />
        <div
          className={resizeBarClassName}
          onMouseDown={this.handleDragStart}
          ref={this.resizeBar_ref}
        ></div>
        <ResizablePanel {...panel2} />
      </div>
    )
  }
}
