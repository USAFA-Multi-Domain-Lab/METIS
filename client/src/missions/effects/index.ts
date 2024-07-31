import { ClientTargetEnvironment } from 'src/target-environments'
import ClientTarget from 'src/target-environments/targets'
import { TClientMissionTypes, TMissionNavigable } from '..'
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
  implements TMissionNavigable
{
  /**
   * The message to display when the effect is invalid.
   */
  private _invalidMessage: string
  /**
   * The message to display when the effect is invalid.
   */
  public get invalidMessage(): string {
    return this._invalidMessage
  }

  // Implemented
  public get targetEnvironment(): ClientTargetEnvironment | null {
    if (this.target instanceof ClientTarget) {
      return this.target.targetEnvironment
    } else {
      return null
    }
  }

  // Implemented
  public get path(): TMissionNavigable[] {
    return [this.mission, this.force, this.node, this.action, this]
  }

  /**
   * Class representing an effect on the client-side that can be
   * applied to a target.
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

    // Set the invalid message.
    this._invalidMessage = ''

    // If the target ID is provided and the mission is not in session, populate the target data.
    if (data.targetId && !this.mission.inSession) {
      this.populateTargetData(data.targetId)
    }
  }

  // Implemented
  public async populateTargetData(targetId: string): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        // Populate the target data.
        this._target = await ClientTarget.$fetchOne(targetId)
        // Resolve the promise.
        resolve()
      } catch (error: any) {
        // Log the error.
        console.error('Error loading target data for effect.\n', error)
        // Reject the promise.
        reject(error)
      }
    })
  }

  /**
   * Validates the effect.
   * @returns True if the effect is valid, false otherwise.
   */
  public validate(targetEnv: ClientTargetEnvironment[]): boolean {
    // If the effect's target environment is null, return false.
    if (!this.targetEnvironment) {
      this._invalidMessage =
        'This effect does not have a target environment. Please delete this effect and create a new one.'
      return false
    }
    // If the effect's target is null, return false.
    if (!this.target) {
      this._invalidMessage =
        'This effect does not have a target. Please delete this effect and create a new one.'
      return false
    }

    // Find the current target environment.
    let currentTargetEnv = targetEnv.find(
      (env) => env._id === this.targetEnvironment?._id,
    )
    // If the effect's target environment cannot be found, return false.
    if (!currentTargetEnv) {
      this._invalidMessage =
        `This effect's target environment "${this.targetEnvironment.name}" could not be found.` +
        `Please delete this effect and create a new one.`
      return false
    }
    // If the effect's target environment version doesn't match the current version, return false.
    if (this.targetEnvironmentVersion !== currentTargetEnv.version) {
      this._invalidMessage =
        `This effect's target environment "${this.targetEnvironment.name}" has a different version.` +
        `Incompatible versions could cause an effect to fail to be applied to its target during a session.` +
        `Please contact an administrator on how to resolve this issue.`
      return false
    }

    // Find the current target.
    let currentTarget = currentTargetEnv.targets.find(
      (target) => target._id === this.target?._id,
    )
    // If the effect's target cannot be found, return false.
    if (!currentTarget) {
      this._invalidMessage =
        `This effect's target "${this.target.name}" could not be found.` +
        `Please delete this effect and create a new one.`
      return false
    }
    // Otherwise, check the effect's arguments against the target's arguments.
    else {
      // Check each argument.
      for (let argId in this.args) {
        // Find the argument in the target.
        let arg = currentTarget.args.find((arg) => arg._id === argId)
        // If the argument cannot be found, return false
        if (!arg) {
          this._invalidMessage =
            `This effect's argument "${argId}" could not be found within the target "${this.target.name}".` +
            `Please delete this effect and create a new one.`
          return false
        }
        // Otherwise, check the argument's value.
        else {
          // Check if the argument is required and has a value.
          if (arg.required && !this.args[argId]) {
            this._invalidMessage =
              `The argument "${arg.name}" within the effect "${this.name}" is required but has no value.` +
              `Please enter a value or delete this effect and create a new one.`
            return false
          }
          // Check if the argument is a dropdown and the selected option is valid.
          if (
            arg.type === 'dropdown' &&
            !arg.options.find((option) => option._id === this.args[argId])
          ) {
            this._invalidMessage =
              `The field labeled "${arg.name}" has an invalid option selected.` +
              `Please select a valid option or delete this effect and create a new one.`
            return false
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
          //   return false
          // }
          // Check if the argument is a force and the force exists.
          if (
            arg.type === 'force' &&
            !this.mission.getForce(this.args[argId][ForceArg.FORCE_ID_KEY])
          ) {
            this._invalidMessage =
              `The field labeled "${arg.name}" has a force selected that could not be found in the current mission.` +
              `Please select a valid force or delete this effect and create a new one.`
            return false
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
            // If the force cannot be found, return false.
            if (!force) {
              this._invalidMessage =
                `The field labeled "Force" has a force selected that could not be found in the current mission.` +
                `Please select a valid force or delete this effect and create a new one.`
              return false
            }
            // If the node cannot be found, return false.
            if (!node) {
              this._invalidMessage =
                `The field labeled "${arg.name}" has a node selected that could not be found in the current mission.` +
                `Please select a valid node or delete this effect and create a new one.`
              return false
            }
          }
          // Check if the argument has dependencies and they are met.
          if (
            !currentTarget.allDependenciesMet(
              arg.dependencies,
              this.args,
              this.mission,
            )
          ) {
            this._invalidMessage =
              `This effect has an argument "${argId}" that doesn't belong.` +
              `Please delete this effect and create a new one.`
            return false
          }
        }
      }
    }

    // If all checks pass, return true.
    return true
  }
}

/* ------------------------------ CLIENT EFFECT TYPES ------------------------------ */

/**
 * The options for creating a ClientEffect.
 */
export type TClientEffectOptions = TEffectOptions & {}
