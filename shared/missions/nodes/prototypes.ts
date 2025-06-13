import { v4 as generateHash } from 'uuid'
import { TMission } from '..'
import { TMetisBaseComponents } from '../../'
import MissionComponent from '../component'

/**
 * This represents a prototype for a mission node displayed
 * in the master tab in the mission map.
 */
export default abstract class MissionPrototype<
  T extends TMetisBaseComponents = TMetisBaseComponents,
> extends MissionComponent<T, MissionPrototype<T>> {
  /**
   * @see {@link MissionComponent.mission}
   */
  protected _mission: TMission<T>
  // Implemented
  public get mission(): TMission<T> {
    return this._mission
  }

  // Overridden
  public get name(): string {
    return this._id.substring(0, 8)
  }
  // Overridden
  public set name(value: string) {
    throw new Error('Cannot set name of MissionPrototype.')
  }

  public get path(): [...MissionComponent<any, any>[], this] {
    return [this.mission, this]
  }

  // Implemented
  public get defective(): boolean {
    return false
  }

  // Implemented
  public get defectiveMessage(): string {
    return ''
  }

  /**
   * The parent of this prototype in the tree structure.
   */
  public parent: TPrototype<T> | null

  /**
   * The direct children of this prototype in
   * the tree structure.
   */
  public children: TPrototype<T>[]

  /**
   * Any prototypes that descend from this prototype
   * in the tree structure.
   */
  public get descendants(): TPrototype<T>[] {
    let descendants: TPrototype<T>[] = []

    this.children.forEach((child: TPrototype<T>) => {
      descendants.push(child)
      descendants.push(...child.descendants)
    })

    return descendants
  }

  /**
   * The key used in the structure object to represent
   * a node's position and relationships to other nodes.
   */
  public structureKey: string

  /**
   * Cache for the depth padding of the node.
   */
  protected _depthPadding: number
  /**
   * The amount of visual padding to apply to the left
   * of the node in the tree.
   */
  public get depthPadding(): number {
    return this._depthPadding
  }
  public set depthPadding(value: number) {
    this._depthPadding = value
  }

  /**
   * The first child of this prototype in the tree structure.
   */
  public get firstChild(): TPrototype<T> | null {
    return this.children.length > 0 ? this.children[0] : null
  }

  /**
   * The last child of this prototype in the tree structure.
   */
  public get lastChild(): TPrototype<T> | null {
    return this.children.length > 0
      ? this.children[this.children.length - 1]
      : null
  }

  /**
   * Whether or not this prototype has children in the
   * tree structure.
   */
  public get hasChildren(): boolean {
    return this.children.length > 0
  }

  /**
   * Whether or not this prototype has siblings in the
   * tree structure.
   */
  public get hasSiblings(): boolean {
    return this.childrenOfParent.length > 1
  }

  /**
   * The siblings of this prototype in the tree structure.
   */
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

  /**
   * The children of the parent of this prototype in the
   * tree structure.
   */
  public get childrenOfParent(): TPrototype<T>[] {
    let childrenOfParent: TPrototype<T>[] = []

    if (this.parent !== null) {
      childrenOfParent = this.parent.children
    }

    return childrenOfParent
  }

  /**
   * The sibling, if any, ordered before this prototype in
   * the structure.
   */
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

  /**
   * The sibling, if any, ordered after this prototype in
   * the structure.
   */
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
    data: Partial<TMissionPrototypeJson> = MissionPrototype.DEFAULT_PROPERTIES,
    options: TMissionPrototypeOptions<TPrototype<T>> = {},
  ) {
    super(data._id ?? MissionPrototype.DEFAULT_PROPERTIES._id, '', false)

    // Set properties from data.
    this._mission = mission
    this.structureKey =
      data.structureKey ?? MissionPrototype.DEFAULT_PROPERTIES.structureKey
    this._depthPadding =
      data.depthPadding ?? MissionPrototype.DEFAULT_PROPERTIES.depthPadding

    // Set properties from options.
    this.parent = options.parent ?? null
    this.children = options.children ?? []
  }

  /**
   * Converts the prototype node to JSON.
   * @param options The options for converting the prototype node to JSON.
   * @returns the JSON for the prototype node.
   */
  public toJson(options?: TMissionPrototypeJsonOptions): TMissionPrototypeJson {
    return {
      _id: this._id,
      depthPadding: this.depthPadding,
      structureKey: this.structureKey,
    }
  }

  /**
   * The default properties for a `MissionPrototype` object.
   */
  public static get DEFAULT_PROPERTIES(): Required<TMissionPrototypeJson> {
    return {
      _id: generateHash(),
      structureKey: generateHash(),
      depthPadding: 0,
    }
  }
}

/* ------------------------------ NODE TYPES ------------------------------ */

/**
 * Interface of the JSON object for a mission prototype.
 */
export type TMissionPrototypeJson = {
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
export type TMissionPrototypeOptions<TRelative extends MissionPrototype> = {
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
 * Extracts the prototype type from a registry of
 * METIS components that extends `TMetisBaseComponents`.
 * @param T The type registry.
 * @returns The prototype type.
 */
export type TPrototype<T extends TMetisBaseComponents> = T['prototype']
