import Mission, {
  TCommonMissionTypes,
  TMissionObjectValidationKwargs,
} from 'metis/missions'
import { TCommonMissionForceJson } from 'metis/missions/forces'
import { TMissionPrototypeOptions } from 'metis/missions/nodes/prototypes'
import StringToolbox from 'metis/toolbox/strings'
import seedrandom, { PRNG } from 'seedrandom'
import ServerTargetEnvironment from '../target-environments'
import { TTargetEnvContextMission } from '../target-environments/context-provider'
import ServerTarget from '../target-environments/targets'
import ServerMissionAction from './actions'
import ServerActionExecution from './actions/executions'
import { ServerRealizedOutcome } from './actions/outcomes'
import ServerEffect from './effects'
import ServerMissionForce from './forces'
import ServerMissionNode from './nodes'
import ServerMissionPrototype from './nodes/prototypes'

/**
 * Class for managing missions on the server.
 */
export default class ServerMission extends Mission<TServerMissionTypes> {
  // Implemented
  public get nodes(): ServerMissionNode[] {
    return this.forces.map((force) => force.nodes).flat()
  }

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

  // Implemented
  protected initializeRoot(): ServerMissionPrototype {
    return new ServerMissionPrototype(this, 'ROOT')
  }

  // Implemented
  public importPrototype(
    _id?: string,
    options: TMissionPrototypeOptions<ServerMissionPrototype> = {},
  ): ServerMissionPrototype {
    let root: ServerMissionPrototype | null = this.root

    // If the mission has no root prototype, throw an error.
    if (root === null) {
      throw new Error('Cannot spawn prototype: Mission has no root prototype.')
    }

    // If the _id is not provided, generate a random one.
    if (_id === undefined) _id = StringToolbox.generateRandomId()

    // Create new prototype.
    let prototype: ServerMissionPrototype = new ServerMissionPrototype(
      this,
      _id,
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
    data: TCommonMissionForceJson[],
  ): ServerMissionForce[] {
    let forces = data.map((datum) => new ServerMissionForce(this, datum))
    this.forces.push(...forces)
    return forces
  }

  // Implemented
  public validateObjects(
    args:
      | TServerMissionObjectValidationKwargs
      | TServerMissionObjectValidationKwargs[],
  ): void {
    // Ensure args is an array.
    if (!Array.isArray(args)) args = [args]
    // Initialize the invalid objects array.
    this._invalidObjects = []

    // Loop through args.
    for (let arg of args) {
      // Grab the key from the arg.
      let { key } = arg

      // Validate the effects.
      if (key === 'effects') {
        for (let node of this.nodes) {
          for (let action of node.actions.values()) {
            for (let effect of action.effects) {
              // Populate the target data for the effect.
              if (effect.targetStatus === 'Not Populated') {
                effect.populateTargetData()
              }
              // Validate the effect.
              if (
                effect.targetStatus === 'Populated' &&
                effect.validate(arg.targetEnvironments) === 'invalid' &&
                !this._invalidObjects.includes(effect)
              ) {
                this._invalidObjects.push(effect)
              }
            }
          }
        }
      }
    }
  }

  /**
   * Extracts the necessary properties from the mission to be used as a reference
   * in a target environment.
   * @returns The mission's necessary properties.
   */
  public toTargetEnvContext(): TTargetEnvContextMission {
    return {
      _id: this._id,
      name: this.name,
      forces: this.forces.map((force) => force.toTargetEnvContext()),
      nodes: this.nodes.map((node) => node.toTargetEnvContext()),
    }
  }
}

/**
 * Server types for Mission objects.
 * @note Used as a generic argument for all server,
 * mission-related classes.
 */
export interface TServerMissionTypes extends TCommonMissionTypes {
  mission: ServerMission
  force: ServerMissionForce
  prototype: ServerMissionPrototype
  node: ServerMissionNode
  action: ServerMissionAction
  execution: ServerActionExecution
  outcome: ServerRealizedOutcome
  targetEnv: ServerTargetEnvironment
  target: ServerTarget
  effect: ServerEffect
  invalidObject:
    | ServerMissionForce
    | ServerMissionNode
    | ServerMissionAction
    | ServerEffect
}

/**
 * Represents the types of invalid objects found within the mission.
 */
export type TServerMissionInvalidObject = TServerMissionTypes['invalidObject']

/**
 * Arguments needed to validate objects found within the mission.
 * @example
 * {
 *  key: 'effects',
 *  targetEnvironments: []
 * }
 */
type TServerMissionObjectValidationKwargs =
  TMissionObjectValidationKwargs<TServerMissionTypes>
