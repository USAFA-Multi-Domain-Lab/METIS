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
}
