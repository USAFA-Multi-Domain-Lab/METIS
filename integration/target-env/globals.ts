import { loadConfig as loadConfig_source } from '@metis/config'
import { TargetDependency as TargetDependency_source } from '@metis/schema/TargetDependency'
import { TargetEnvSchema as TargetEnvSchema_source } from '@metis/schema/TargetEnvSchema'
import { TargetSchema as TargetSchema_source } from '@metis/schema/TargetSchema'
import type * as TargetEnvTypes from '@metis/schema/types'
import type * as MetisComponentTypes from '../../shared/MetisComponent'

// Assignment of global values:
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
Object.defineProperty(globalThis, 'loadConfig', {
  value: loadConfig_source,
  writable: false,
  configurable: false,
})

/* -- TYPES -- */

declare global {
  // Declare globally accessible values:

  const TargetEnvSchema: typeof TargetEnvSchema_source
  export type TargetEnvSchema = TargetEnvSchema_source

  const TargetSchema: typeof TargetSchema_source
  export type TargetSchema = TargetSchema_source

  const TargetDependency: typeof TargetDependency_source
  export type TargetDependency = TargetDependency_source

  const loadConfig: typeof loadConfig_source
  export type loadConfig = typeof loadConfig_source

  // Forward type exports:

  export type TBaseArg = TargetEnvTypes.TBaseArg
  export type TBaseArgJson = TargetEnvTypes.TBaseArgJson
  export type TForceMetadata = TargetEnvTypes.TForceMetadata
  export type TNodeMetadata = TargetEnvTypes.TNodeMetadata
  export type TActionMetadata = TargetEnvTypes.TActionMetadata
  export type TFileMetadata = TargetEnvTypes.TFileMetadata

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
