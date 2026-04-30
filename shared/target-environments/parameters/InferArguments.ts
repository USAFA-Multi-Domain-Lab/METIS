/**
 * Proof of concept: derive a typed arguments object from a parameter tuple.
 *
 * The core idea is that each `TTargetParameter` has two pieces of information
 * that fully describe its slot in the arguments object:
 *
 *   - `_id`      → the key in the arguments object
 *   - `type`     → the value's runtime type
 *   - `required` → whether the key is mandatory or optional
 *
 * By inferring those literals (via `const` type-parameter inference on
 * `defineParams`), TypeScript can produce a precise `{ [_id]: value }` shape
 * for every parameter and intersect them into a single arguments type.
 *
 * For `dropdown` parameters, the exact union of option `value` fields is also
 * inferred when the options array is defined in the same `defineParams` call.
 */

import type {
  TActionMetadata,
  TFileMetadata,
  TForceMetadata,
  TNodeMetadata,
  TPoolMetadata,
  TResourceMetadata,
} from '../types'
import type { TDropdownTargetParameterOptionVal } from './DropdownTargetParameter'

/* -- Type machinery -- */

/**
 * The minimum shape a parameter object must satisfy to be usable with
 * {@link InferArguments} and {@link defineParams}.
 *
 * Both {@link TTargetParameter} (used at runtime in missions) and
 * {@link TTargetParameterJson} (used in target schema definitions) are
 * structural subtypes of this, so either array flavour can be passed to
 * {@link defineParams} without a cast.
 */
export type TParamLike = {
  _id: string
  type: string
  required?: boolean
  options?: ReadonlyArray<{ value: unknown }> | Array<{ value: unknown }>
}

/**
 * Maps each parameter `type` string to the corresponding runtime value type
 * that appears in the effect's arguments object.
 *
 * `dropdown` is intentionally omitted here — it is handled separately by
 * {@link InferDropdownValue} so that exact option values can be inferred.
 */
type ParamTypeToArgValue = {
  'number': number
  'string': string
  'large-string': string
  'boolean': boolean
  'force': TForceMetadata
  'node': TNodeMetadata
  'action': TActionMetadata
  'file': TFileMetadata
  'resource': TResourceMetadata
  'pool': TPoolMetadata
  'mission-component': string | string[]
}

/**
 * Standard helper: collapses a union of object types into an intersection.
 * @example `UnionToIntersection<{ a: number } | { b: string }>` → `{ a: number } & { b: string }`
 */
type UnionToIntersection<U> = (
  U extends unknown ? (x: U) => void : never
) extends (x: infer I) => void
  ? I
  : never

/**
 * For a dropdown parameter, extracts the union of all option `value` types.
 * When the options array is a statically-known tuple (possible only when the
 * parameter is defined inside a `defineParams` call), this collapses to the
 * exact `'fast' | 'slow'`-style union rather than the wide
 * `TDropdownTargetParameterOptionVal` fallback.
 */
type InferDropdownValue<P> = P extends {
  options: ReadonlyArray<{ value: infer V }> | Array<{ value: infer V }>
}
  ? V
  : TDropdownTargetParameterOptionVal

/**
 * Maps a single parameter to its `{ [_id]: value }` contribution.
 *
 * - `required: true`  → the key is **required** in the arguments object.
 * - Everything else   → the key is **optional**.
 */
type SingleParamToArg<P> =
  // Dropdown — required
  P extends { _id: infer Id extends string; type: 'dropdown'; required: true }
    ? { [K in Id]: InferDropdownValue<P> }
    : // Dropdown — optional
      P extends { _id: infer Id extends string; type: 'dropdown' }
      ? { [K in Id]?: InferDropdownValue<P> }
      : // Everything else — required
        P extends {
            _id: infer Id extends string
            type: infer T extends keyof ParamTypeToArgValue
            required: true
          }
        ? { [K in Id]: ParamTypeToArgValue[T] }
        : // Everything else — optional
          P extends {
              _id: infer Id extends string
              type: infer T extends keyof ParamTypeToArgValue
            }
          ? { [K in Id]?: ParamTypeToArgValue[T] }
          : never

/**
 * Derives the fully-typed arguments object shape from a readonly tuple of
 * {@link TParamLike} objects (typically {@link TTargetParameter} or
 * {@link TTargetParameterJson}).
 *
 * The parameter array **must** be defined via {@link defineParams} (or an
 * equivalent `const`-inferring context) so that the literal `_id` and `type`
 * values are preserved by TypeScript. Without that, `_id` widens to `string`
 * and inference collapses to `Record<string, unknown>`.
 *
 * @example
 * ```typescript
 * const params = defineParams([
 *   { _id: 'count', type: 'number', required: true,  default: 0, name: 'Count' },
 *   { _id: 'label', type: 'string', required: false,             name: 'Label' },
 * ])
 *
 * type Args = InferArguments<typeof params>
 * // { count: number; label?: string }
 * ```
 */
export type InferArguments<Params extends readonly TParamLike[]> =
  UnionToIntersection<SingleParamToArg<Params[number]>>

/**
 * Identity helper that uses the `const` type-parameter modifier (TypeScript 5.0+)
 * to preserve the literal types of every field in the parameter objects.
 *
 * Without this (or an equivalent `as const satisfies` expression), TypeScript
 * widens `_id: 'count'` to `_id: string`, which makes it impossible to
 * determine the argument key at the type level.
 *
 * Accepts any array of {@link TParamLike} objects — both
 * {@link TTargetParameter} and {@link TTargetParameterJson} qualify.
 */
export function defineParams<const Params extends readonly TParamLike[]>(
  params: Params,
): Params {
  return params
}

/* -- Proof of concept -- */

// Phase 1 assertion: TTargetParameterJson must satisfy TParamLike so that
// defineParams / InferArguments work with the JSON-flavour parameter arrays
// used in target schema definitions (not just the runtime TTargetParameter).
import type { TTargetParameterJson } from './TargetParameter'
type _JsonSatisfiesParamLike = TTargetParameterJson extends TParamLike
  ? true
  : false
const _jsonCheck: _JsonSatisfiesParamLike = true

/**
 * A representative set of parameters covering every common type.
 * Hover over `ExampleArgs` below to see the inferred shape.
 */
const exampleParams = defineParams([
  // required number  → required key
  { _id: 'count', type: 'number', required: true, default: 0, name: 'Count' },
  // optional string  → optional key
  { _id: 'label', type: 'string', required: false, name: 'Label' },
  // boolean (no `required` field at all) → optional key
  { _id: 'enabled', type: 'boolean', name: 'Enabled' },
  // required node    → required key, value is TNodeMetadata
  { _id: 'target', type: 'node', required: true, name: 'Target' },
  // required dropdown with statically-known options → exact value union
  {
    _id: 'mode',
    type: 'dropdown',
    required: true,
    name: 'Mode',
    default: { _id: 'fast', name: 'Fast', value: 'fast' as const },
    options: [
      { _id: 'fast', name: 'Fast', value: 'fast' as const },
      { _id: 'slow', name: 'Slow', value: 'slow' as const },
    ],
  },
  // optional dropdown → optional key, exact value union
  {
    _id: 'strategy',
    type: 'dropdown',
    required: false,
    name: 'Strategy',
    options: [
      { _id: 'a', name: 'Alpha', value: 1 as const },
      { _id: 'b', name: 'Beta', value: 2 as const },
      { _id: 'c', name: 'Gamma', value: 3 as const },
    ],
  },
])

/**
 * Hover over this type to verify the inferred shape:
 * ```
 * {
 *   count:      number            // required
 *   target:     TNodeMetadata     // required
 *   mode:       'fast' | 'slow'   // required, exact option values
 *   label?:     string
 *   enabled?:   boolean
 *   strategy?:  1 | 2 | 3         // optional, exact option values
 * }
 * ```
 */
export type ExampleArgs = InferArguments<typeof exampleParams>

/* -- Compile-time assertions -- */

// ✅  All required keys present
const _valid: ExampleArgs = {
  count: 42,
  target: { forceKey: 'blue', nodeKey: 'server1' },
  mode: 'fast',
  label: 'hello',
  enabled: true,
  strategy: 2,
}

// ✅  Omitting every optional key is fine
const _minimal: ExampleArgs = {
  count: 1,
  target: {},
  mode: 'slow',
}
//
// // @ts-expect-error — `count` is required
// const _missingRequired: ExampleArgs = { target: {}, mode: 'fast' }
//
// // @ts-expect-error — `label` must be a string, not a number
// const _wrongType: ExampleArgs = { count: 1, target: {}, mode: 'fast', label: 42 }
//
// // @ts-expect-error — 'turbo' is not one of the valid mode options
// const _invalidDropdownValue: ExampleArgs = { count: 1, target: {}, mode: 'turbo' }
//
// // @ts-expect-error — 99 is not one of the valid strategy values
// const _invalidStrategyValue: ExampleArgs = { count: 1, target: {}, mode: 'fast', strategy: 99 }
