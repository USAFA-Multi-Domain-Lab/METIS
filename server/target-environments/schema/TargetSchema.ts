import type { TMissionComponentType } from '@shared/target-environments/parameters/mission-component/MissionComponentTargetParameter'
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
import type {
  TGetArgumentsFunctionLoose,
  TTargetScriptExposedContext,
} from '../context/TargetScriptContext'
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
   *   script: async (context, { hours, minutes, seconds }) => {
   *     let delayTime: number = 0
   *
   *     // Update the delay time based on the provided values.
   *     delayTime += hours * 3600 * 1000 // ms
   *     delayTime += minutes * 60 * 1000 // ms
   *     delayTime += seconds * 1000 // ms
   *
   *     // Only resolve after the delay time has passed.
   *     await context.sleep(delayTime)
   *   },
   * })
   * ```
   */
  public static create<
    const Parameters extends readonly TTargetParameterJson[],
  >(
    options: TTargetSchemaCreateOptions<Parameters> & {
      parameters: TWithValidatedDropdownDefaults<NoInfer<Parameters>>
    },
  ): TargetSchema {
    const { script: typedScript, parameters } = options

    const wrappedScript: TTargetScript = (context) => {
      // Dependency-gated resolution lives on the context's `getArguments` (backed by
      // each argument's `dependenciesMet`), so the wrapper just collects every
      // parameter's value into the `effectArguments` object passed to the script.
      const effectArguments = context.getArguments(
        parameters.map((parameter) => parameter._id),
      ) as TScriptArgumentValues<Parameters>

      return typedScript(
        context as TTargetScriptContext<Parameters>,
        effectArguments,
      )
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
 * The minimum shape a parameter must have to be used with the target schema
 * typing utilities. Both {@link TTargetParameterJson} and {@link TTargetParameter}
 * satisfy this shape.
 */
type TCompatibleParameter = {
  _id: string
  type: keyof TSelectExposedArgumentValue
  required?: boolean
  validComponentTypes?:
    | readonly TMissionComponentType[]
    | TMissionComponentType[]
  options?: ReadonlyArray<{ value: unknown }> | Array<{ value: unknown }>
  dependencies?: readonly string[] | string[]
}

/**
 * Maps each mission component type string to the corresponding exposed component
 * object that will be available as an argument value at runtime.
 */
type TExposedMissionComponentByType = {
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
 * Resolves the argument value type for a single parameter based on its `type`,
 * `required` flag, `validComponentTypes`, and `options` — before considering
 * whether the parameter has unsatisfied dependencies.
 */
type TBaseArgumentValue<Parameter extends TCompatibleParameter> =
  Parameter extends {
    type: 'mission-component'
    validComponentTypes:
      | ReadonlyArray<infer ComponentType extends TMissionComponentType>
      | Array<infer ComponentType extends TMissionComponentType>
  }
    ? Array<TExposedMissionComponentByType[ComponentType]>
    : Parameter extends { type: 'number'; required: true }
      ? NonNullable<TSelectExposedArgumentValue['number']>
      : Parameter extends {
            type: 'dropdown'
            options:
              | ReadonlyArray<{ value: infer OptionValue }>
              | Array<{ value: infer OptionValue }>
          }
        ? OptionValue
        : TSelectExposedArgumentValue[Parameter['type']]

/**
 * Adds `| undefined` to a parameter's value type when that parameter declares
 * at least one dependency. A parameter whose dependencies are not met will
 * receive `undefined` at runtime.
 */
type THasDependenciesSoMaybeUndefined<
  Parameter extends TCompatibleParameter,
  Value,
> = Parameter extends {
  dependencies: readonly [string, ...string[]] | [string, ...string[]]
}
  ? Value | undefined
  : Value

/**
 * The fully resolved argument value type for a single parameter. Combines the
 * base value type with the dependency-undefined check.
 *
 * - `mission-component` with `validComponentTypes` → `Array<T | U | ...>` using
 *   only the listed component types instead of the full {@link TExposedArgCompatibleComponent} union.
 * - `number` with `required: true` → `number` (strips `null`, which is only
 *   possible for optional numbers that the user left blank).
 * - `dropdown` with `options` → the exact union of each option's `value` type
 *   instead of the wide {@link TDropdownTargetParameterOptionVal} fallback.
 * - Any parameter with a non-empty `dependencies` array → `T | undefined`,
 *   because the framework sets the argument to `undefined` when its
 *   dependencies are not met.
 */
type TResolvedArgumentValue<Parameter extends TCompatibleParameter> =
  THasDependenciesSoMaybeUndefined<Parameter, TBaseArgumentValue<Parameter>>

/**
 * A record mapping each parameter's `_id` string literal to its fully resolved
 * argument value type. This is the shape of the `effectArguments` object passed
 * to a typed target script, and the value map backing {@link TGetArgumentsFunction}.
 *
 * @example
 * ```ts
 * type ArgumentValues = TScriptArgumentValues<typeof MyTarget.parameters>
 * // ArgumentValues['callsign'] → string, ArgumentValues['heading'] → number | undefined, etc.
 * ```
 */
export type TScriptArgumentValues<
  Parameters extends readonly TCompatibleParameter[],
> = {
  readonly [Parameter in Parameters[number] as Parameter extends {
    _id: infer Key extends string
  }
    ? string extends Key
      ? never
      : Key
    : never]: TResolvedArgumentValue<Parameter>
}

/**
 * The typed function signature for `getArguments` on a parameterized target
 * script context. Overloaded: passing a single parameter `_id` returns that
 * argument's value; passing an array of `_id`s returns an object mapping each
 * `_id` to its value.
 */
type TGetArgumentsFunction<
  Parameters extends readonly TCompatibleParameter[],
> = {
  <Key extends keyof TScriptArgumentValues<Parameters>>(
    id: Key,
  ): TScriptArgumentValues<Parameters>[Key]
  <Key extends keyof TScriptArgumentValues<Parameters>>(
    ids: readonly Key[],
  ): { [EachKey in Key]: TScriptArgumentValues<Parameters>[EachKey] }
}

/**
 * The context object passed to a target script. This is the single canonical
 * context type, shared by {@link TargetSchema.create} and by any helper that
 * receives the context — such as a modular target-parameter `script` method.
 *
 * When given a parameter list, `getArguments` is precisely typed: it accepts
 * only those parameters' `_id`s and returns each argument's resolved value type.
 * When used without a parameter list (the default), `getArguments` keeps its
 * loosely-typed signature — useful for helpers that operate across many targets
 * and do not care about a specific parameter list.
 *
 * A context typed for a larger parameter list is assignable to one typed for a
 * subset, so a parent target can pass its fully-typed context to a module whose
 * `script` only declares its own parameters.
 */
export type TTargetScriptContext<
  Parameters extends readonly TCompatibleParameter[] = [],
> = Omit<TTargetScriptExposedContext, 'getArguments'> & {
  getArguments: [Parameters] extends [readonly []]
    ? TGetArgumentsFunctionLoose
    : TGetArgumentsFunction<Parameters>
}

/**
 * A target script function that receives a precisely-typed context and a record
 * of resolved argument values derived from the given parameter list. Use with
 * {@link TargetSchema.create} so TypeScript can infer each argument's type from
 * the `parameters` array at the call site. The context's `getArguments` accessor
 * is narrowed to the same parameter list, replacing the base context's loosely
 * typed getter.
 */
export type TTargetScriptWithParameterTypes<
  Parameters extends readonly TCompatibleParameter[],
> = (
  context: TTargetScriptContext<Parameters>,
  effectArguments: TScriptArgumentValues<Parameters>,
) => Promise<void>

/**
 * For a required dropdown parameter, produces the shape
 * `{ default: one of the declared option values }` so that intersecting it
 * constrains the `default` field to a valid option. For all other parameter
 * types, resolves to `unknown` (the intersection identity), leaving the
 * parameter type unchanged.
 */
type TDropdownDefaultValidator<Parameter> = Parameter extends {
  type: 'dropdown'
  required: true
  options: infer Options extends readonly { _id: string }[]
}
  ? { default: Options[number]['_id'] }
  : unknown

/**
 * Maps over a parameter list and intersects each required-dropdown entry with
 * {@link TDropdownDefaultValidator}, producing a compile-time error when a
 * `default` value is not one of the declared option values. All other parameter
 * types pass through unchanged.
 */
type TWithValidatedDropdownDefaults<Parameters extends readonly unknown[]> = {
  [Key in keyof Parameters]: Parameters[Key] &
    TDropdownDefaultValidator<Parameters[Key]>
}

/**
 * Options for {@link TargetSchema.create}.
 *
 * Like {@link TTargetSchemaOptions} except that `parameters` preserves the
 * narrowly-typed tuple (keeping literal `_id` and `type` values) and `script`
 * accepts a typed function that receives argument values derived from that
 * parameter list.
 */
export interface TTargetSchemaCreateOptions<
  Parameters extends readonly TTargetParameterJson[],
> extends Omit<TTargetSchemaOptions, 'script' | 'parameters'> {
  parameters: Parameters
  script: TTargetScriptWithParameterTypes<Parameters>
}
