import type * as TMetisComponentTypes from './MetisComponent'

declare global {
  /**
   * Info for the METIS project.
   */
  export type TMetisInfo = {
    /**
     * The name of the project.
     */
    name: string
    /**
     * The description for the project.
     */
    description: string
    /**
     * The version of the project.
     */
    version: string
  }

  // Externally defined types that are used widely:

  export type TMetisBaseComponents = TMetisComponentTypes.TMetisBaseComponents
  export type TMetisComponentJson = TMetisComponentTypes.TMetisComponentJson
  export type TCreateJsonType<
    T extends TMetisComponentTypes.MetisComponent,
    TDirect extends keyof T,
    TIndirect extends { [k in keyof T]?: any } = {},
  > = TMetisComponentTypes.TCreateJsonType<T, TDirect, TIndirect>

  /**
   * Valid icons to use in the application.
   * @note These are all SVG icons that are stored
   * in the `client/src/assets/icons` directory. New icons
   * should be added there.
   * ### Special Types
   * - `'_blank'`: Does not do anything and cannot be seen.
   * Acts as a filler when the space needs to be
   * filled up, but no button is required.
   */
  export type TMetisIcon =
    // ! If adding to list, please maintain
    // ! alphabetical order.
    | '_blank'
    | 'add'
    | 'ban'
    | 'blockquote'
    | 'bold'
    | 'bullet-list'
    | 'cancel'
    | 'clear-format'
    | 'close'
    | 'code'
    | 'copy'
    | 'code-block'
    | 'device'
    | 'divider'
    | 'door'
    | 'down'
    | 'download'
    | 'edit'
    | 'file'
    | 'flag'
    | 'gear'
    | 'group'
    | 'hammer'
    | 'home'
    | 'indicator'
    | 'italic'
    | 'key'
    | 'kick'
    | 'launch'
    | 'left'
    | 'lightning'
    | 'link'
    | 'lock'
    | 'logout'
    | 'no-door'
    | 'no-repeat'
    | 'node'
    | 'open'
    | 'options'
    | 'ordered-list'
    | 'overflow'
    | 'pan'
    | 'percent'
    | 'play'
    | 'private'
    | 'question'
    | 'quit'
    | 'redo'
    | 'remove'
    | 'reorder'
    | 'repeat'
    | 'reset'
    | 'right'
    | 'save'
    | 'search'
    | 'shell'
    | 'shield'
    | 'shown'
    | 'strike'
    | 'stop'
    | 'text-cursor'
    | 'timer'
    | 'underline'
    | 'undo'
    | 'unlink'
    | 'up'
    | 'upload'
    | 'user'
    | 'warning-transparent'
    | 'waves'
    | 'zoom-in'
    | 'zoom-out'
    | 'resources/coins'
    | 'resources/dollar'
    | 'resources/drops'
    | 'resources/earth'
    | 'resources/group'
    | 'resources/handshake'
    | 'resources/helmet'
    | 'resources/microchip'
    | 'resources/raised-fist'
    | 'resources/star'
    | 'resources/supplies'
    | 'resources/trophy'
    | 'resources/two-people'
}
