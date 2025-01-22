import { ClientTargetEnvironment } from 'src/target-environments'
import ClientTarget from 'src/target-environments/targets'
import { TClientMissionTypes, TMissionComponent, TMissionNavigable } from '..'
import Effect, {
  TCommonEffectJson,
  TEffectOptions,
} from '../../../../shared/missions/effects'
import ForceArg from '../../../../shared/target-environments/args/force-arg'
import NodeArg from '../../../../shared/target-environments/args/node-arg'
import ClientMissionAction from '../actions'

/**
 * Class representing an effect on the client-side that can be
 * applied to a target.
 */
export class ClientEffect
  extends Effect<TClientMissionTypes>
  implements TMissionComponent
{
  // Implemented
  public get path(): TMissionNavigable[] {
    return [this.mission, this.force, this.node, this.action, this]
  }

  /**
   * The message to display when the effect is defective.
   */
  private _defectiveMessage: string
  /**
   * The message to display when the effect is defective.
   */
  public get defectiveMessage(): string {
    return this._defectiveMessage
  }

  /**
   * @param action The action to which the effect belongs.
   * @param data The data for the effect.
   * @param options The options for the effect.
   */
  public constructor(
    action: ClientMissionAction,
    data: Partial<TCommonEffectJson> = ClientEffect.DEFAULT_PROPERTIES,
    options: TClientEffectOptions = {},
  ) {
    super(action, data, options)
    this._defectiveMessage = ''
  }

  /**
   * Evaluates if the effect is defective or not.
   * @returns boolean indicating if the effect is defective or not.
   */
  public isDefective(): boolean {
    // If the effect's target or target environment cannot be found, then the effect is defective.
    // *** Note: An effect grabs the target environment from the target after the
    // *** target is populated. So, if the target cannot be found, the target will
    // *** be set null which means the target environment will be null also.
    // *** Also, if a target-environment cannot be found, then obviously the target
    // *** within that environment cannot be found either.
    if (!this.targetEnvironment || !this.target) {
      this._defectiveMessage =
        `The effect, "${this.name}", has a target or a target environment that couldn't be found. ` +
        `Please contact an administrator on how to resolve this conflict, or delete the effect and create a new one.`
      return true
    }

    // Get all the target environments.
    let targetEnvs = ClientTargetEnvironment.getAll()

    // Find the current target environment.
    let currentTargetEnv = targetEnvs.find(
      (env) => env._id === this.targetEnvironment?._id,
    )
    // If the effect's target environment cannot be found, then the effect is defective.
    if (!currentTargetEnv) {
      this._defectiveMessage =
        `The effect, "${this.name}", has a target environment, "${this.targetEnvironment.name}", that couldn't be found. ` +
        `Please contact an administrator on how to resolve this conflict, or delete the effect and create a new one.`
      return true
    }
    // If the effect's target environment version doesn't match the current version, then the effect is defective.
    if (this.targetEnvironmentVersion !== currentTargetEnv.version) {
      this._defectiveMessage =
        `The effect, "${this.name}", has a target environment, "${this.targetEnvironment.name}", with an incompatible version. ` +
        `Incompatible versions can cause an effect to fail to be applied to its target during a session. ` +
        `Please contact an administrator on how to resolve this conflict, or delete the effect and create a new one.`
      return true
    }

    // Find the current target.
    let currentTarget = currentTargetEnv.targets.find(
      (target) => target._id === this.target?._id,
    )
    // If the effect's target cannot be found, then the effect is defective.
    if (!currentTarget) {
      this._defectiveMessage =
        `The effect, "${this.name}", has a target, "${this.target.name}", that couldn't be found. ` +
        `Please delete the effect and create a new one.`
      return true
    }
    // Otherwise, check the effect's arguments against the target's arguments.
    else {
      // Check each argument.
      for (let argId in this.args) {
        // Find the argument in the target.
        let arg = currentTarget.args.find((arg) => arg._id === argId)
        // If the argument cannot be found, then the effect is defective.
        if (!arg) {
          this._defectiveMessage =
            `The effect, "${this.name}", has an argument, "${argId}", that couldn't be found within the target, "${this.target.name}." ` +
            `Please delete the effect and create a new one.`
          return true
        }
        // Otherwise, check the argument's value.
        else {
          // Check if the argument is required and has a value.
          // * Note: Boolean arguments are always required because
          // * they always have a value (true or false). Therefore,
          // * they don't contain the required property.
          if (
            arg.type !== 'boolean' &&
            arg.required &&
            this.args[argId] === undefined &&
            this.allDependenciesMet(arg.dependencies)
          ) {
            this._defectiveMessage =
              `The argument, "${arg.name}", within the effect, "${this.name}", is required, yet has no value. ` +
              `Please enter a value, or delete the effect and create a new one.`
            return true
          }
          // Check if the argument is a boolean and has a value.
          if (
            arg.type === 'boolean' &&
            this.args[argId] === undefined &&
            this.allDependenciesMet(arg.dependencies)
          ) {
            this._defectiveMessage =
              `The argument, "${arg.name}", within the effect, "${this.name}", is required, yet has no value. ` +
              `Please update the value by clicking the toggle switch, or delete the effect and create a new one.`
            return true
          }
          // Check if the argument is a dropdown and the selected option is valid.
          if (
            arg.type === 'dropdown' &&
            !arg.options.find((option) => option._id === this.args[argId])
          ) {
            this._defectiveMessage =
              `The effect, "${this.name}", has an invalid option selected. ` +
              `Please select a valid option, or delete the effect and create a new one.`
            return true
          }
          // todo: implement pattern validation and determine how to display the pattern to the user
          // // Check if the argument is a string and matches the required pattern.
          // if (
          //   arg.type === 'string' &&
          //   arg.pattern &&
          //   !arg.pattern.test(this.args[argId])
          // ) {
          //   this._invalidMessage =
          //     `The field labeled "${arg.name}" does not match the required pattern ${arg.pattern}` +
          //     `Please enter a valid value or delete this effect and create a new one.`
          //   return true
          // }
          // Check if the argument is a force and the force exists.
          if (
            arg.type === 'force' &&
            !this.mission.getForce(this.args[argId][ForceArg.FORCE_ID_KEY])
          ) {
            this._defectiveMessage = `The effect, "${
              this.name
            }", targets a force, "${
              this.args[argId][ForceArg.FORCE_NAME_KEY]
            }", which cannot be found.`
            return true
          }
          // Check if the argument is a node and the node exists.
          if (arg.type === 'node') {
            // Get the force and node.
            let force = this.mission.getForce(
              this.args[argId][ForceArg.FORCE_ID_KEY],
            )
            let node = this.mission.getNode(
              this.args[argId][NodeArg.NODE_ID_KEY],
            )
            // If the force cannot be found, then the effect is defective.
            if (!force) {
              this._defectiveMessage = `The effect, "${
                this.name
              }", targets a force, "${
                this.args[argId][ForceArg.FORCE_NAME_KEY]
              }", which cannot be found.`
              return true
            }
            // If the node cannot be found, then the effect is defective.
            if (!node) {
              this._defectiveMessage = `The effect, "${
                this.name
              }", targets a node "${
                this.args[argId][NodeArg.NODE_NAME_KEY]
              }", which cannot be found.`
              return true
            }
          }
          // If the argument exists within the effect even thought not all of its dependencies are met, then
          // effect is defective.
          if (
            !this.allDependenciesMet(arg.dependencies) &&
            this.args[argId] !== undefined
          ) {
            this._defectiveMessage =
              `The effect, "${this.name}", has an argument, "${arg.name}", that doesn't belong. ` +
              `Please delete the effect and create a new one.`
            return true
          }
        }
      }
    }

    // If all checks pass, then the effect is not defective.
    return false
  }

  /**
   * Populates the target data for the effect.
   * @param targetId The ID of the target to populate.
   */
  protected populateTargetData(targetId: string | null | undefined): void {
    // Get the target from the target environment.
    let target = ClientTarget.getTarget(targetId)

    // If the target is found, set it and update the
    // target status to 'Populated'.
    if (target) this._target = target
  }
}

/* ------------------------------ CLIENT EFFECT TYPES ------------------------------ */

/**
 * The options for creating a ClientEffect.
 */
export type TClientEffectOptions = TEffectOptions & {}
