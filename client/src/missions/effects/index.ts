import { TMetisClientComponents } from 'src'
import { ClientTargetEnvironment } from 'src/target-environments'
import ClientTarget from 'src/target-environments/targets'
import { TCreateJsonType } from '../../../../shared'
import Effect, {
  TEffectJsonDirect,
  TEffectJsonIndirect,
} from '../../../../shared/missions/effects'
import ClientMissionAction from '../actions'

/**
 * Class representing an effect on the client-side that can be
 * applied to a target.
 */
export class ClientEffect extends Effect<TMetisClientComponents> {
  /**
   * The default properties for a duplicated effect.
   */
  private readonly _defaultDuplicateProperties: TEffectDuplicateParams = {
    action: this.action,
    _id: ClientEffect.DEFAULT_PROPERTIES._id,
    name: this.name,
    description: this.description,
    args: this.args,
    targetId: this.targetId,
    environmentId: this.environmentId,
    targetEnvironmentVersion: this.targetEnvironmentVersion,
    trigger: this.trigger,
    localKey: this.localKey,
  }

  /**
   * @param action The action that the effect belongs to.
   * @param data The effect data from which to create the effect.
   */
  public constructor(action: ClientMissionAction, data: TClientEffectJson) {
    super(action, data)
  }

  // Implemented
  protected determineTarget(
    targetId: string,
    environmentId: string,
  ): ClientTarget | null {
    // todo: Allow user to decide which target to use
    // todo: if multiple targets with the same ID exist
    // todo: in different environments
    if (environmentId === ClientEffect.ENVIRONMENT_ID_INFER) {
      return ClientTargetEnvironment.REGISTRY.inferTarget(targetId) ?? null
    } else {
      return (
        ClientTargetEnvironment.REGISTRY.getTarget(targetId, environmentId) ??
        null
      )
    }
  }

  /**
   * Duplicates the effect, creating a new effect with the same properties
   * as this one or with the provided properties.
   * @returns A new effect with the same properties as this one or with the
   * provided properties.
   * @note **Any properties provided will override using the properties from
   * the effect that is being duplicated.**
   * @note ***If the original effect is an internal effect (affects a component
   * within metis - forces, nodes, actions, etc.), the arguments will need to
   * be updated to make sure they affect the correct component(s).***
   * @note ***If the original effect is not an internal effect, the arguments will
   * be duplicated as is.***
   * @default action = originalEffect.action
   * @default _id = ClientEffect.DEFAULT_PROPERTIES._id // generates a new UUID
   * @default name = originalEffect.name
   * @default description = originalEffect.description
   * @default args = originalEffect.args
   * @default targetId = originalEffect.targetId
   * @default environmentId = originalEffect.environmentId
   * @default targetEnvironmentVersion = originalEffect.targetEnvironmentVersion
   * @default trigger = originalEffect.trigger
   * @default localKey = originalEffect.localKey
   * @example
   * const newEffect = effect.duplicate({
   *   action: newAction, // This will be the duplicated effect's new action.
   *   _id: 'new-effect-id', // This will be the duplicated effect's new ID.
   *   name: 'New Effect', // This will be the duplicated effect's new name.
   *   description: 'New Effect Description', // This will be the duplicated effect's new description.
   *   args: [], // This will be the duplicated effect's new arguments.
   *   targetId: 'new-target-id', // This will be the duplicated effect's new target ID.
   *   environmentId: 'new-environment-id', // This will be the duplicated effect's new environment ID.
   *   targetEnvironmentVersion: 'new-target-environment-version', // This will be the duplicated effect's new target environment version.
   *   trigger: 'new-trigger', // This will be the duplicated effect's new trigger.
   *   localKey: 'new-local-key', // This will be the duplicated effect's new local key.
   * })
   * @example
   * // If no properties are provided, the duplicated effect will
   * // have the same properties as the original effect except for
   * // the ID and the arguments. The ID will be generated using
   * // `ClientEffect.DEFAULT_PROPERTIES._id` and the arguments
   * // will be duplicated using the `duplicateArgs` method of the
   * // `ClientEffect` class. See the default property values
   * // above for more information.
   * const newEffect = effect.duplicate()
   */
  public duplicate({
    action = this._defaultDuplicateProperties.action,
    _id = this._defaultDuplicateProperties._id,
    name = this._defaultDuplicateProperties.name,
    description = this._defaultDuplicateProperties.description,
    args = this._defaultDuplicateProperties.args,
    targetId = this._defaultDuplicateProperties.targetId,
    environmentId = this._defaultDuplicateProperties.environmentId,
    targetEnvironmentVersion = this._defaultDuplicateProperties
      .targetEnvironmentVersion,
    trigger = this._defaultDuplicateProperties.trigger,
    localKey = this._defaultDuplicateProperties.localKey,
  }: TEffectDuplicateArgs): ClientEffect {
    return new ClientEffect(action, {
      _id,
      name,
      description,
      args,
      targetId,
      environmentId,
      targetEnvironmentVersion,
      trigger,
      localKey,
    })
  }

  /**
   * @param target The target for the new effect.
   * @param action The action that will trigger the effect.
   * @returns A new effect with the provided target,
   * populated with the corresponding target environment
   * and target environment version. All other values
   * will be set to the default values found in
   * `Effect.DEFAULT_PROPERTIES`.
   */
  public static createBlankEffect(
    target: ClientTarget,
    action: ClientMissionAction,
  ): ClientEffect {
    let data: TClientEffectJson = {
      ...ClientEffect.DEFAULT_PROPERTIES,
      _id: ClientEffect.DEFAULT_PROPERTIES._id,
      name: ClientEffect.DEFAULT_PROPERTIES.name,
      description: ClientEffect.DEFAULT_PROPERTIES.description,
      args: ClientEffect.DEFAULT_PROPERTIES.args,
      trigger: ClientEffect.DEFAULT_PROPERTIES.trigger,
      targetId: target._id,
      environmentId: target.environment._id,
      targetEnvironmentVersion: target.environment.version,
      localKey: action.generateEffectKey(),
    }
    return new ClientEffect(action, data)
  }
}

/* ------------------------------ CLIENT EFFECT TYPES ------------------------------ */

/**
 * The JSON representation of an `Effect` object.
 * @note This is a carbon copy of the `TEffectJson` type
 * from the shared library and is used to temporarily fix the
 * any issue that happens when importing from the shared
 * library.
 * @see /shared/missions/effects/index.ts
 */
type TClientEffectJson = TCreateJsonType<
  ClientEffect,
  TEffectJsonDirect,
  TEffectJsonIndirect
>

/**
 * The arguments used to duplicate an effect.
 */
type TEffectDuplicateArgs = Partial<TClientEffectJson> & {
  /**
   * The action that the duplicated effect will belong to.
   * @default originalEffect.action
   */
  action?: ClientMissionAction
}

/**
 * The parameters used to duplicate an effect.
 */
type TEffectDuplicateParams = TClientEffectJson & {
  /**
   * The action that the duplicated effect will belong to.
   * @default originalEffect.action
   */
  action: ClientMissionAction
}
