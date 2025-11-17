import type { TTargetScriptExposedContext } from '@server/target-environments/context/TargetScriptContext'
import type { TTargetEnvWorkerData } from '@server/target-environments/TargetEnvSandbox'
import { parentPort } from 'node:worker_threads'
import { TargetSchema } from '../../server/target-environments/schema/TargetSchema'

type TTargetScriptExposedCallbackKey = {
  [K in keyof TTargetScriptExposedContext]: TTargetScriptExposedContext[K] extends Function
    ? K
    : never
}[keyof TTargetScriptExposedContext]

export class TargetEnvWorker {
  public constructor(
    /**
     * The data provided to the worker to execute the
     * requested operation.
     */
    protected readonly data: TTargetEnvWorkerData,
  ) {}
  private createCallbackProxy(callbackKey: string) {
    let { context } = this.data
    return (...args: any[]) => {
      parentPort?.postMessage({
        type: 'callback',
        method: callbackKey,
        args,
      })
    }
  }

  public async execute(): Promise<void> {
    try {
      switch (this.data.operation) {
        case 'execute-target-script': {
          // Load and execute the target script with provided context
          let { schemaPath, context } = this.data
          let schema = require(schemaPath).default

          if (schema instanceof TargetSchema === false) {
            throw new Error(
              `Module at "${schemaPath}" does not export a TargetSchema instance`,
            )
          }

          let exposedContext: TTargetScriptExposedContext = {
            ...context,
            localStore: {} as any,
            globalStore: {} as any,
            sendOutput: this.createCallbackProxy('sendOutput'),
            blockNode: this.createCallbackProxy('blockNode'),
            unblockNode: this.createCallbackProxy('unblockNode'),
            openNode: this.createCallbackProxy('openNode'),
            closeNode: this.createCallbackProxy('closeNode'),
            modifySuccessChance: this.createCallbackProxy(
              'modifySuccessChance',
            ),
            modifyProcessTime: this.createCallbackProxy('modifyProcessTime'),
            modifyResourceCost: this.createCallbackProxy('modifyResourceCost'),
            modifyResourcePool: this.createCallbackProxy('modifyResourcePool'),
            grantFileAccess: this.createCallbackProxy('grantFileAccess'),
            revokeFileAccess: this.createCallbackProxy('revokeFileAccess'),
          }

          const result = await schema.script(exposedContext)
          parentPort?.postMessage({ type: 'result', success: true, result })
          break
        }
        default:
          throw new Error(`Unknown operation: ${this.data.operation}`)
      }
    } catch (error) {
      parentPort?.postMessage({
        type: 'result',
        success: false,
        error: {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
      })
    }
  }
}
