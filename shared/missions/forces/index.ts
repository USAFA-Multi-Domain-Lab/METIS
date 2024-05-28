import { v4 as generateHash } from 'uuid'
import { TCommonMission } from '..'
import { TCommonMissionNode, TCommonMissionNodeJson } from '../nodes'

/* -- CLASSES -- */

/**
 * Represents a force in a mission, which is a collection of nodes
 * that are interacted with by a group of participants in a session.
 */
export class MissionForce<
  TMission extends TCommonMission,
  TMissionNode extends TCommonMissionNode,
> implements TCommonMissionForce
{
  // Implemented
  public mission: TMission

  /**
   * The ID of the force.
   */
  public _id: string

  /**
   * The name of the force.
   */
  public name: string

  /**
   * The color of the force.
   */
  public color: string

  /**
   * The nodes in the force.
   */
  public nodes: TMissionNode[]

  /**
   * @param data The force data from which to create the force. Any ommitted
   * values will be set to the default properties defined in
   * MissionForce.DEFAULT_PROPERTIES.
   * @param options The options for creating the force.
   */
  public constructor(
    mission: TMission,
    data: Partial<TCommonMissionForceJson> = MissionForce.DEFAULT_PROPERTIES,
    options: TMissionForceOptions = {},
  ) {
    this.mission = mission
    this._id = data._id?.toString() ?? MissionForce.DEFAULT_PROPERTIES._id
    this.name = data.name ?? MissionForce.DEFAULT_PROPERTIES.name
    this.color = data.color ?? MissionForce.DEFAULT_PROPERTIES.color
    this.nodes = []
  }

  /**
   * The default properties for a Mission object.
   */
  public static get DEFAULT_PROPERTIES(): Required<TCommonMissionForceJson> {
    return {
      _id: generateHash(),
      name: 'New Force',
      color: '#000000',
      nodes: [],
    }
  }
}

/* -- TYPES -- */

/**
 * Interface of the abstract MissionForce class.
 * @note Any public, non-static properties and functions of the Force
 * class must first be defined here for them to be accessible to the
 * Mission, MissionNode, and MissionAction classes.
 */
export interface TCommonMissionForce {
  /**
   * The ID of the force.
   */
  _id: string
  /**
   * The name of the force.
   */
  name: string
  /**
   * The color of the force.
   */
  color: string
  /**
   * The nodes in the force.
   */
  nodes: TCommonMissionNode[]
}

/**
 * Plain JSON representation of a MissionNode object.
 */
export interface TCommonMissionForceJson {
  /**
   * The ID of the force.
   */
  _id?: string
  /**
   * The name of the force.
   */
  name: string
  /**
   * The color of the force.
   */
  color: string
  /**
   * The nodes in the force.
   */
  nodes: TCommonMissionNodeJson[]
}

/**
 * Options for creating a MissionForce object.
 */
export type TMissionForceOptions = {
  /**
   * Whether or not to force open all nodes.
   * @default false
   */
  openAll?: boolean
}
