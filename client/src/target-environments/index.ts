import axios from 'axios'
import { TMetisClientComponents } from 'src'
import TargetEnvironment, {
  TTargetEnvJson,
} from '../../../shared/target-environments'
import TargetEnvRegistry from '../../../shared/target-environments/registry'
import { TTargetJson } from '../../../shared/target-environments/targets'
import ClientTarget from './targets'

/**
 * Class representing a target environment on the client-side.
 */
export class ClientTargetEnvironment extends TargetEnvironment<TMetisClientComponents> {
  // Implemented
  protected parseTargets(data: TTargetJson[]): ClientTarget[] {
    return data.map((datum: TTargetJson) => {
      return new ClientTarget(this, datum)
    })
  }

  // Implemented
  public register(): ClientTargetEnvironment {
    ClientTargetEnvironment.REGISTRY.register(this)
    return this
  }

  /**
   * The API endpoint for managing target environments.
   */
  public static readonly API_ENDPOINT: string = '/api/v1/target-environments'

  /**
   * A registry of all target environments installed
   * on the server and provided to the client.
   */
  public static readonly REGISTRY: TargetEnvRegistry<TMetisClientComponents> =
    new TargetEnvRegistry()

  /**
   * Populates the registry with the target environments
   * found on the server.
   * @resolves If the target environments are successfully loaded.
   * @rejects If there is an error loading the target environments.
   * @note The registry will be cleared before population.
   */
  public static $populateRegistry(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        // Wipe the registry.
        ClientTargetEnvironment.REGISTRY.clear()

        // Fetch the target environments from the API.
        let { data } = await axios.get<TTargetEnvJson[]>(
          `${ClientTargetEnvironment.API_ENDPOINT}`,
        )
        // Create new target environments from the data.
        data.map((datum) => new ClientTargetEnvironment(datum).register())
      } catch (error: any) {
        console.error('Failed to load target environments.')
        console.error(error)
        reject(error)
      }
    })
  }
}
