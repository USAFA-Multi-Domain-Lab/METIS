import Mission, {
  TCommonMissionTypes,
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
import SessionServer from '../sessions'
import ServerSessionMember from '../sessions/members'
import ServerTargetEnvironment from '../target-environments'
import { TTargetEnvExposedMission } from '../target-environments/context'
import ServerTarget from '../target-environments/targets'
import ServerUser from '../users'
import ServerMissionAction from './actions'
import ServerActionExecution from './actions/executions'
import { ServerRealizedOutcome } from './actions/outcomes'
import ServerEffect from './effects'
import ServerMissionForce, { TServerMissionForceOptions } from './forces'
import ServerOutput from './forces/output'
import ServerMissionNode from './nodes'
import ServerMissionPrototype from './nodes/prototypes'

/**
 * Class for managing missions on the server.
 */
export default class ServerMission extends Mission<TServerMissionTypes> {
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
 * Server types for Mission objects.
 * @note Used as a generic argument for all server,
 * mission-related classes.
 */
export interface TServerMissionTypes extends TCommonMissionTypes {
  session: SessionServer
  member: ServerSessionMember
  user: ServerUser
  mission: ServerMission
  force: ServerMissionForce
  output: ServerOutput
  prototype: ServerMissionPrototype
  node: ServerMissionNode
  action: ServerMissionAction
  execution: ServerActionExecution
  outcome: ServerRealizedOutcome
  targetEnv: ServerTargetEnvironment
  target: ServerTarget
  effect: ServerEffect
}

/**
 * Options for the creation of a `ServerMission` object.
 */
type TServerMissionOptions = TMissionOptions & {}
