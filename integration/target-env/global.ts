import { TargetDependency as TargetDependency_source } from '@metis/schema/TargetDependency'
import { TargetEnvSchema as TargetEnvSchema_source } from '@metis/schema/TargetEnvSchema'
import { TargetSchema as TargetSchema_source } from '@metis/schema/TargetSchema'
import type * as TargetEnvTypes from '@metis/schema/types'
import { MetisServer } from '@server/MetisServer'
import type * as ServerContextTypes from '@server/target-environments/context/TargetEnvContext'
import type * as MetisComponentTypes from '../../shared/MetisComponent'

// Assignment of global values:
Object.defineProperty(globalThis, 'METIS_VERSION', {
  value: MetisServer.PROJECT_VERSION,
  writable: false,
  configurable: false,
})
Object.defineProperty(globalThis, 'TargetEnvSchema', {
  value: TargetEnvSchema_source,
  writable: false,
  configurable: false,
})
Object.defineProperty(globalThis, 'TargetSchema', {
  value: TargetSchema_source,
  writable: false,
  configurable: false,
})
Object.defineProperty(globalThis, 'TargetDependency', {
  value: TargetDependency_source,
  writable: false,
  configurable: false,
})

/* -- TYPES -- */

declare global {
  // Declare globally accessible values:

  export const METIS_VERSION: string

  const TargetEnvSchema: typeof TargetEnvSchema_source
  export type TargetEnvSchema = TargetEnvSchema_source

  const TargetSchema: typeof TargetSchema_source
  export type TargetSchema = TargetSchema_source

  const TargetDependency: typeof TargetDependency_source
  export type TargetDependency = TargetDependency_source

  // Forward type exports:

  export type TBaseTargetParameter = TargetEnvTypes.TBaseTargetParameter
  export type TBaseTargetParameterJson = TargetEnvTypes.TBaseTargetParameterJson
  export type TTargetParameterJson = TargetEnvTypes.TTargetParameterJson
  export type TTargetScriptContext<
    TParameters extends readonly TTargetParameterJson[] = [],
  > = TargetEnvTypes.TTargetScriptContext<TParameters>
  export type TTargetScriptArguments<
    TParameters extends readonly TTargetParameterJson[],
  > = TargetEnvTypes.TScriptArgumentValues<TParameters>
  export type TTargetSchemaOptions = TargetEnvTypes.TTargetSchemaOptions
  export type TTargetScript = TargetEnvTypes.TTargetScript
  export type TTargetEnvExposedForce = ServerContextTypes.TTargetEnvExposedForce
  export type TTargetEnvExposedNode = ServerContextTypes.TTargetEnvExposedNode
  export type TTargetEnvExposedAction =
    ServerContextTypes.TTargetEnvExposedAction
  export type TTargetEnvExposedFile = ServerContextTypes.TTargetEnvExposedFile
  export type TTargetEnvExposedPool = ServerContextTypes.TTargetEnvExposedPool
  export type TTargetEnvExposedResource =
    ServerContextTypes.TTargetEnvExposedResource

  // These types aren't globally accessible, but they are
  // needed contextually in order to resolve other types
  // in the integration folder:

  type TCreateJsonType<
    T extends MetisComponentTypes.MetisComponent,
    TDirect extends keyof T,
    TIndirect extends { [k in keyof T]?: any } = {},
  > = MetisComponentTypes.TCreateJsonType<T, TDirect, TIndirect>
}

export {}
