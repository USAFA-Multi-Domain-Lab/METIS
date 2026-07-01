export interface TRootElementRefSupport<
  TElement extends HTMLElement = HTMLDivElement,
> {
  /**
   * A ref to the root element of the component, for use in
   * effects or other interactions with the DOM.
   */
  elementRef?: React.RefObject<TElement | null>
}
