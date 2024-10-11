import { v4 as generateHash } from 'uuid'
import { TCommonMission, TCommonMissionTypes, TMission } from '..'

/**
 * This represents a prototype for a mission node displayed
 * in the master tab in the mission map.
 */
export default abstract class MissionPrototype<
  T extends TCommonMissionTypes = TCommonMissionTypes,
> implements TCommonMissionPrototype
{
  // Implemented
  public mission: TMission<T>

  // Implemented
  public _id: TCommonMissionPrototype['_id']

  // Implemented
  public parent: TPrototype<T> | null

  // Implemented
  public children: TPrototype<T>[]

  // Inherited
  public structureKey: TCommonMissionPrototype['structureKey']

  /**
   * Cache for the depth padding of the node.
   */
  protected _depthPadding: number
  // Implemented
  public get depthPadding(): number {
    return this._depthPadding
  }
  // Implemented
  public set depthPadding(value: number) {
    this._depthPadding = value
  }

  // Implemented
  public get firstChild(): TPrototype<T> | null {
    return this.children.length > 0 ? this.children[0] : null
  }

  // Implemented
  public get lastChild(): TPrototype<T> | null {
    return this.children.length > 0
      ? this.children[this.children.length - 1]
      : null
  }

  // Implemented
  public get hasChildren(): TCommonMissionPrototype['hasChildren'] {
    return this.children.length > 0
  }

  // Implemented
  public get hasSiblings(): TCommonMissionPrototype['hasSiblings'] {
    return this.childrenOfParent.length > 1
  }

  // Implemented
  public get siblings(): TPrototype<T>[] {
    let siblings: TPrototype<T>[] = []

    if (this.parent !== null) {
      let childrenOfParent: TPrototype<T>[] = this.parent.children

      siblings = childrenOfParent.filter(
        (childOfParent: TPrototype<T>) => childOfParent._id !== this._id,
      )
    }

    return siblings
  }

  // Implemented
  public get childrenOfParent(): TPrototype<T>[] {
    let childrenOfParent: TPrototype<T>[] = []

    if (this.parent !== null) {
      childrenOfParent = this.parent.children
    }

    return childrenOfParent
  }

  // Implemented
  public get previousSibling(): TPrototype<T> | null {
    let previousSibling: TPrototype<T> | null = null

    if (this.parent !== null) {
      let childrenOfParent: TPrototype<T>[] = this.parent.children

      childrenOfParent.forEach(
        (childOfParent: TPrototype<T>, index: number) => {
          if (childOfParent._id === this._id && index > 0) {
            previousSibling = childrenOfParent[index - 1]
          }
        },
      )
    }

    return previousSibling
  }

  // Implemented
  public get followingSibling(): TPrototype<T> | null {
    let followingSibling: TPrototype<T> | null = null

    if (this.parent !== null) {
      let childrenOfParent: TPrototype<T>[] = this.parent.children

      childrenOfParent.forEach(
        (childOfParent: TPrototype<T>, index: number) => {
          if (
            childOfParent._id === this._id &&
            index + 1 < childrenOfParent.length
          ) {
            followingSibling = childrenOfParent[index + 1]
          }
        },
      )
    }

    return followingSibling
  }

  /**
   * @param mission The mission of which the prototype is a part.
   * @param data The prototype data from which to create the prototype node. Any ommitted values will be set to the default properties defined in MissionPrototype.DEFAULT_PROPERTIES.
   * @param options The options for creating the prototype.
   */
  public constructor(
    mission: TMission<T>,
    data: Partial<TCommonMissionPrototypeJson> = MissionPrototype.DEFAULT_PROPERTIES,
    options: TMissionPrototypeOptions<TPrototype<T>> = {},
  ) {
    // Set properties from data.
    this.mission = mission
    this._id = data._id ?? MissionPrototype.DEFAULT_PROPERTIES._id
    this.structureKey =
      data.structureKey ?? MissionPrototype.DEFAULT_PROPERTIES.structureKey
    this._depthPadding =
      data.depthPadding ?? MissionPrototype.DEFAULT_PROPERTIES.depthPadding

    // Set properties from options.
    this.parent = options.parent ?? null
    this.children = options.children ?? []
  }

  // Implemented
  public toJson(
    options?: TMissionPrototypeJsonOptions,
  ): TCommonMissionPrototypeJson {
    return {
      _id: this._id,
      depthPadding: this.depthPadding,
      structureKey: this.structureKey,
    }
  }

  /**
   * The default properties for a `MissionPrototype` object.
   */
  public static get DEFAULT_PROPERTIES(): Required<TCommonMissionPrototypeJson> {
    return {
      _id: generateHash(),
      structureKey: generateHash(),
      depthPadding: 0,
    }
  }
}

/* ------------------------------ NODE TYPES ------------------------------ */

/**
 * Interface of the abstract MissionNode class.
 * @note Any public, non-static properties and functions of the MissionNode class
 * must first be defined here for them to be accessible to the Mission and
 * MissionAction classes.
 */
export interface TCommonMissionPrototype {
  /**
   * The mission of which the prototype is a part.
   */
  mission: TCommonMission
  /**
   * The ID for the prototype.
   */
  _id: string
  /**
   * The amount of visual padding to apply to the left of the node in the tree.
   */
  get depthPadding(): number
  set depthPadding(value: number)
  /**
   * The key used in the structure object to represent a node's position and relationships to other
   * nodes.
   */
  structureKey: string
  /**
   * The parent of this prototype in the tree structure.
   */
  parent: TCommonMissionPrototype | null
  /**
   * The children of this prototype in the tree structure.
   */
  children: TCommonMissionPrototype[]
  /**
   * Whether or not this prototype has children.
   */
  hasChildren: boolean
  /**
   * Whether or not this prototype has siblings.
   */
  hasSiblings: boolean
  /**
   * The siblings of this prototype.
   */
  siblings: TCommonMissionPrototype[]
  /**
   * The children of the parent of this prototype (Essentially siblings plus self).
   */
  childrenOfParent: TCommonMissionPrototype[]
  /**
   * The sibling, if any, ordered before this prototype in the structure.
   */
  previousSibling: TCommonMissionPrototype | null
  /**
   * The sibling, if any, ordered after this prototype in the structure.
   */
  followingSibling: TCommonMissionPrototype | null
  /**
   * Converts the prototype node to JSON.
   * @param options The options for converting the prototype node to JSON.
   * @returns the JSON for the prototype node.
   */
  toJson: (
    options?: TMissionPrototypeJsonOptions,
  ) => TCommonMissionPrototypeJson
}

/**
 * Interface of the JSON object for a mission prototype.
 */
export type TCommonMissionPrototypeJson = {
  /**
   * The ID for the prototype.
   */
  _id: string
  /**
   * The amount of visual padding to apply to the left of the node in the tree.
   */
  depthPadding: number
  /**
   * The key used in the structure object to represent a node's position and relationships to other
   * nodes.
   */
  structureKey: string
}

/**
 * Options for converting a prototype node to JSON.
 */
export type TMissionPrototypeJsonOptions = {}

/**
 * Options for creating a MissionNode object.
 */
export type TMissionPrototypeOptions<
  TRelative extends TCommonMissionPrototype,
> = {
  /**
   * The prototype of which this prototype is a child.
   * @default null
   */
  parent?: TRelative | null
  /**
   * The children of this prototype.
   * @default []
   */
  children?: TRelative[]
}

/**
 * Extracts the prototype type from the mission types.
 * @param T The mission types.
 * @returns The prototype type.
 */
export type TPrototype<T extends TCommonMissionTypes> = T['prototype']
