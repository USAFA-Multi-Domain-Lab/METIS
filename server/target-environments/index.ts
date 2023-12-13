import { TargetEnvironment } from 'metis/target-environments'
import { ServerTarget } from './targets'
import { TCommonTargetJson } from 'metis/target-environments/targets'

export class ServerTargetEnvironment extends TargetEnvironment<ServerTarget> {
  // Implemented
  public parseTargets(data: TCommonTargetJson[]): ServerTarget[] {
    return data.map((datum: TCommonTargetJson) => {
      return new ServerTarget(this, datum)
    })
  }
}
