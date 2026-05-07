import type { TMissionComponentType } from '@shared/target-environments/parameters/mission-component/MissionComponentTargetParameter2'
import type { TTargetParameterJson } from '@shared/target-environments/parameters/TargetParameter'
import type { TTargetJson } from '@shared/target-environments/targets/Target'
import type {
  TExposedArgCompatibleComponent,
  TSelectExposedArgumentValue,
} from '../arguments/ServerTargetArgument'
import type {
  TTargetEnvExposedAction,
  TTargetEnvExposedFile,
  TTargetEnvExposedForce,
  TTargetEnvExposedMission,
  TTargetEnvExposedNode,
  TTargetEnvExposedPool,
  TTargetEnvExposedResource,
} from '../context/TargetEnvContext'
import type { TTargetScriptExposedContext } from '../context/TargetScriptContext'
import { TargetMigrationRegistry } from '../TargetMigrationRegistry'

/**
 * Defines a target.
 */
export class TargetSchema {
  /**
   * The ID of the target.
   */
  public readonly _id: string

  /**
   * @see {@link Target.targetEnvId}
   */
  private _targetEnvId: string
  /**
   * The ID of the target environment.
   */
  public get targetEnvId(): string {
    return this._targetEnvId
  }
  public set targetEnvId(targetEnvId: string) {
    if (!this.canUpdateTargetEnvId) {
      throw new Error(
        'Target environment ID has already been set and cannot be updated.',
      )
    }
    this._targetEnvId = targetEnvId
  }

  /**
   * The name of the target.
   */
  private _name: string
  public get name(): string {
    return this._name
  }

  /**
   * Describes what the target is.
   */
  private _description: string
  public get description(): string {
    return this._description
  }

  /**
   * The function used to execute an effect on the target.
   */
  private _script: TTargetScript
  public get script(): TTargetScript {
    return this._script
  }

  /**
   * The parameters used to create the effect on the target.
   */
  private _parameters: TTargetParameterJson[]
  public get parameters(): TTargetParameterJson[] {
    return this._parameters
  }

  /**
   * Registry of migrations used to migrate outdated effects
   * to the latest version of the target environment.
   */
  public migrationRegistry: TargetMigrationRegistry

  // Implemented
  public get migrationVersions(): string[] {
    return Object.keys(this.migrationRegistry.versions)
  }

  /**
   * Determines if the target environment ID can be updated.
   */
  public get canUpdateTargetEnvId(): boolean {
    return this._targetEnvId === ''
  }

  /**
   * @param options The data used to define the target.
   */
  private constructor(options: TTargetSchemaOptions) {
    this._id = options._id
    this._targetEnvId = ''
    this._name = options.name
    this._description = options.description
    this._script = options.script
    this._parameters = options.parameters
    this.migrationRegistry = options.migrations ?? new TargetMigrationRegistry()
  }

  /**
   * Creates a new {@link TargetSchema} based on the options passed.
   *
   * @example
   * ```typescript
   * const Delay = TargetSchema.create({
   *   _id: 'delay',
   *   name: 'Delay',
   *   description: '',
   *   parameters: [
   *     { _id: 'hours',   type: 'number', required: true, ... },
   *     { _id: 'minutes', type: 'number', required: true, ... },
   *     { _id: 'seconds', type: 'number', required: true, ... },
   *   ],
   *   script: async (context, hours, minutes, seconds) => {
   *     let delayTime: number = 0
   *
   *     // Update the delay time based on the provided values.
   *     delayTime += delayTimeHours * 3600 * 1000 // ms
   *     delayTime += delayTimeMinutes * 60 * 1000 // ms
   *     delayTime += delayTimeSeconds * 1000 // ms
   *
   *     // Only resolve after the delay time has passed.
   *     await context.sleep(delayTime)
   *   },
   * })
   * ```
   */
  public static create<const Params extends readonly TTargetParameterJson[]>(
    options: TTypedTargetSchemaOptions<Params>,
  ): TargetSchema {
    const { script: typedScript, parameters } = options

    const wrappedScript: TTargetScript = (context) => {
      const argValues = parameters.map((param) => {
        const match = context.effect.arguments.find(
          (arg) => arg.parameterId === param._id,
        )
        return match?.value
      }) as InferArgumentsTuple<Params>
      return typedScript(context, ...argValues)
    }

    return new TargetSchema({
      ...options,
      parameters: [...parameters],
      script: wrappedScript,
    })
  }
}

/* -- TYPES -- */

/**
 * A valid script that can be executed on a target.
 */
export type TTargetScript = (
  /**
   * The context for the target environment.
   */
  context: TTargetScriptExposedContext,
) => Promise<void>

/**
 * Defines the target data.
 */
export interface TTargetSchemaOptions extends Omit<
  TTargetJson,
  'targetEnvId' | 'migrationVersions'
> {
  /**
   * The script which will enact the effect on the target.
   */
  script: TTargetScript
  /**
   * @see {@link TargetSchema.migrationRegistry}
   */
  migrations?: TargetMigrationRegistry
}

/**
 * The minimum shape a parameter must satisfy to be usable with
 * {@link InferArgumentsTuple}. Both {@link TTargetParameterJson} and
 * {@link TTargetParameter} are structural subtypes of this.
 */
type TParamLike = {
  type: keyof TSelectExposedArgumentValue
  required?: boolean
  validComponentTypes?:
    | readonly TMissionComponentType[]
    | TMissionComponentType[]
}

/**
 * Maps a {@link TMissionComponentType} string to the corresponding exposed
 * component type that will appear as an argument value at runtime.
 */
type TSelectExposedMissionComponent = {
  mission: TTargetEnvExposedMission
  force: TTargetEnvExposedForce
  node: TTargetEnvExposedNode
  action: TTargetEnvExposedAction
  missionFile: TTargetEnvExposedFile
  resource: TTargetEnvExposedResource
  resourcePool: TTargetEnvExposedPool
  any: TExposedArgCompatibleComponent
}

/**
 * Extracts the value type for a single parameter, narrowing `mission-component`
 * to `Array<...>` using the literal types in `validComponentTypes` when present,
 * and stripping `null` from required `number` parameters (which always have a
 * default and are guaranteed to be present).
 */
type SingleParamToArgValue<P extends TParamLike> = P extends {
  type: 'mission-component'
  validComponentTypes:
    | ReadonlyArray<infer V extends TMissionComponentType>
    | Array<infer V extends TMissionComponentType>
}
  ? Array<TSelectExposedMissionComponent[V]>
  : P extends { type: 'number'; required: true }
    ? NonNullable<TSelectExposedArgumentValue['number']>
    : TSelectExposedArgumentValue[P['type']]

/**
 * Derives a positional tuple of argument value types from a readonly tuple of
 * parameters, preserving declaration order.
 *
 * Each element corresponds to the exposed value type for the parameter at the
 * same index — sourced from {@link TSelectExposedArgumentValue} so the types
 * always match what a target-env script actually receives at runtime.
 */
export type InferArgumentsTuple<Params extends readonly TParamLike[]> = {
  [K in keyof Params]: Params[K] extends TParamLike
    ? SingleParamToArgValue<Params[K]>
    : never
}

/**
 * A typed script that receives one positional argument per parameter, in
 * declaration order, in addition to the context object.
 *
 * Use with {@link TargetSchema.create} so that TypeScript can infer the
 * argument types from the `parameters` array at the call site.
 */
export type TTypedTargetScript<Params extends readonly TParamLike[]> = (
  context: TTargetScriptExposedContext,
  ...args: InferArgumentsTuple<Params>
) => Promise<void>

/**
 * Options for {@link TargetSchema.create}.
 *
 * Identical to {@link TTargetSchemaOptions} except that `parameters` is the
 * narrowly-typed `Params` tuple (preserving literal `_id`/`type` values) and
 * `script` accepts typed positional arguments derived from those parameters.
 */
export interface TTypedTargetSchemaOptions<
  Params extends readonly TTargetParameterJson[],
> extends Omit<TTargetSchemaOptions, 'script' | 'parameters'> {
  parameters: Params
  script: TTypedTargetScript<Params>
}
