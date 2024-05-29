import { TCommonMission } from '..'

/**
 * This represents a prototype for a mission node displayed
 * in the master tab in the mission map.
 */
export default abstract class MissionPrototype<
  TMission extends TCommonMission,
  TRelativePrototype extends TCommonMissionPrototype,
> implements TCommonMissionPrototype
{
  // Implemented
  public mission: TMission

  // Implemented
  public _id: TCommonMissionPrototype['_id']

  // Implemented
  public parentNode: TRelativePrototype | null

  // Implemented
  public children: TRelativePrototype[]

  // Implemented
  public get firstChildNode(): TRelativePrototype | null {
    return this.children.length > 0 ? this.children[0] : null
  }

  // Implemented
  public get lastChildNode(): TRelativePrototype | null {
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
  public get siblings(): TRelativePrototype[] {
    let siblings: TRelativePrototype[] = []

    if (this.parentNode !== null) {
      let childrenOfParent: TRelativePrototype[] = this.parentNode
        .children as TRelativePrototype[]

      siblings = childrenOfParent.filter(
        (childOfParent: TRelativePrototype) => childOfParent._id !== this._id,
      )
    }

    return siblings
  }

  // Implemented
  public get childrenOfParent(): TRelativePrototype[] {
    let childrenOfParent: TRelativePrototype[] = []

    if (this.parentNode !== null) {
      childrenOfParent = this.parentNode.children as TRelativePrototype[]
    }

    return childrenOfParent
  }

  // Implemented
  public get previousSibling(): TRelativePrototype | null {
    let previousSibling: TRelativePrototype | null = null

    if (this.parentNode !== null) {
      let childrenOfParent: TRelativePrototype[] = this.parentNode
        .children as TRelativePrototype[]

      childrenOfParent.forEach(
        (childOfParent: TRelativePrototype, index: number) => {
          if (childOfParent._id === this._id && index > 0) {
            previousSibling = childrenOfParent[index - 1]
          }
        },
      )
    }

    return previousSibling
  }

  // Implemented
  public get followingSibling(): TRelativePrototype | null {
    let followingSibling: TRelativePrototype | null = null

    if (this.parentNode !== null) {
      let childrenOfParent: TRelativePrototype[] = this.parentNode
        .children as TRelativePrototype[]

      childrenOfParent.forEach(
        (childOfParent: TRelativePrototype, index: number) => {
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
   * @param {TMission} mission The mission of which the prototype is a part.
   * @param _id The ID for the prototype, which is referenced within the node structure
   * of a mission.
   * @param options The options for creating the prototype.
   */
  public constructor(
    mission: TMission,
    _id: TCommonMissionPrototype['_id'],
    options: TMissionPrototypeOptions<TRelativePrototype> = {},
  ) {
    // Set properties from data.
    this.mission = mission
    this._id = _id

    // Set properties from options.
    this.parentNode = options.parent ?? null
    this.children = options.children ?? []
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
   * The parent of this prototype in the tree structure.
   */
  parentNode: TCommonMissionPrototype | null
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
}

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
