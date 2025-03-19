import Mission, {
  TMissionJson,
  TMissionOptions,
  TMissionSaveJson,
} from 'metis/missions'
import { TMissionForceSaveJson } from 'metis/missions/forces'
import {
  TMissionPrototypeJson,
  TMissionPrototypeOptions,
} from 'metis/missions/nodes/prototypes'
import seedrandom, { PRNG } from 'seedrandom'
import { TMetisServerComponents } from '../index'
import { TTargetEnvExposedMission } from '../target-environments/context'
import ServerMissionForce, { TServerMissionForceOptions } from './forces'
import ServerMissionPrototype from './nodes/prototypes'

/**
 * Class for managing missions on the server.
 */
export default class ServerMission extends Mission<TMetisServerComponents> {
  /**
   * The RNG used to generate random numbers for the mission.
   */
  protected _rng: PRNG | undefined
  /**
   * The RNG used to generate random numbers for the mission.
   */
  public get rng(): PRNG {
    // Initialize RNG if not done already. This
    // cannot be done in the constructor due to
    // this value being needed in the super call.
    if (this._rng === undefined) {
      this._rng = seedrandom(`${this.seed}`)
    }
    return this._rng
  }

  /**
   * @param data The mission data from which to create the mission. Any ommitted values will be set to the default properties defined in Mission.DEFAULT_PROPERTIES.
   * @param options The options for creating the mission.
   */
  public constructor(
    data:
      | Partial<TMissionJson>
      | Partial<TMissionSaveJson> = ServerMission.DEFAULT_PROPERTIES,
    options: TServerMissionOptions = {},
  ) {
    // Initialize base properties.
    super(data, options)
  }

  // Implemented
  protected initializeRoot(): ServerMissionPrototype {
    return new ServerMissionPrototype(this, { _id: 'ROOT' })
  }

  // Implemented
  public importPrototype(
    data: Partial<TMissionPrototypeJson> = ServerMissionPrototype.DEFAULT_PROPERTIES,
    options: TMissionPrototypeOptions<ServerMissionPrototype> = {},
  ): ServerMissionPrototype {
    let root: ServerMissionPrototype | null = this.root

    // If the mission has no root prototype, throw an error.
    if (root === null) {
      throw new Error('Cannot spawn prototype: Mission has no root prototype.')
    }

    // Create new prototype.
    let prototype: ServerMissionPrototype = new ServerMissionPrototype(
      this,
      data,
      options,
    )

    // Set the parent prototype to the root
    // prototype.
    prototype.parent = root
    // Add the prototype to the root prototype's
    // children.
    root.children.push(prototype)
    // Add the prototype to the prototype list.
    this.prototypes.push(prototype)

    // Return the prototype.
    return prototype
  }

  // Implemented
  protected importForces(
    data: TMissionForceSaveJson[],
    options: TServerMissionForceOptions = {},
  ): ServerMissionForce[] {
    let forces = data.map(
      (datum) => new ServerMissionForce(this, datum, options),
    )
    this.forces.push(...forces)
    return forces
  }

  /**
   * Extracts the necessary properties from the mission to be used as a reference
   * in a target environment.
   * @returns The mission's necessary properties.
   */
  public toTargetEnvContext(): TTargetEnvExposedMission {
    return {
      _id: this._id,
      name: this.name,
      forces: this.forces.map((force) => force.toTargetEnvContext()),
      nodes: this.nodes.map((node) => node.toTargetEnvContext()),
    }
  }
}
/* ------------------------------ SERVER MISSION TYPES ------------------------------ */

/**
 * Type registry for server mission component classes.
 */
export type TServerMissionComponents = Pick<
  TMetisServerComponents,
  'mission' | 'force' | 'output' | 'prototype' | 'node' | 'action' | 'effect'
>

/**
 * Options for the creation of a `ServerMission` object.
 */
type TServerMissionOptions = TMissionOptions & {}
