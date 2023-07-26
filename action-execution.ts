import { AnyObject, SingleTypeObject } from './modules/toolbox/objects'
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'
import config from './config'
import https from 'https'
import { plcApiLogger } from './modules/logging'

const httpsAgent = new https.Agent({ rejectUnauthorized: false })

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function changeBankColor(data: { color: string }) {
  axios
    .put(`${config.CYBER_CITY_API_HOST}/api/bank`, data, {
      headers: {
        'api-key': `${config.CYBER_CITY_API_KEY}`,
      },
      httpsAgent: httpsAgent,
    })
    .catch((error: AxiosError) => {
      plcApiLogger.error(error)
    })
}

function changeTrafficLightColor(data: {
  zone: string
  direction: string
  color: string
  power: string
}) {
  axios
    .put(`${config.CYBER_CITY_API_HOST}/api/traffic`, data, {
      headers: {
        'api-key': `${config.CYBER_CITY_API_KEY}`,
      },
      httpsAgent: httpsAgent,
    })
    .catch((error: AxiosError) => {
      plcApiLogger.error(error)
    })
}

function changeGasState(data: { power: string; section?: string }) {
  axios
    .put(`${config.CYBER_CITY_API_HOST}/api/gas`, data, {
      headers: {
        'api-key': `${config.CYBER_CITY_API_KEY}`,
      },
      httpsAgent: httpsAgent,
    })
    .catch((error: AxiosError) => {
      plcApiLogger.error(error)
    })
}

function changeLightStripState(data: { power: string }) {
  axios
    .put(`${config.CYBER_CITY_API_HOST}/api/lstrip`, data, {
      headers: {
        'api-key': `${config.CYBER_CITY_API_KEY}`,
      },
      httpsAgent: httpsAgent,
    })
    .catch((error: AxiosError) => {
      plcApiLogger.error(error)
    })
}

function changeBuildingLightColor(data: { building: string; power: string }) {
  axios
    .put(`${config.CYBER_CITY_API_HOST}/api/lights`, data, {
      headers: {
        'api-key': `${config.CYBER_CITY_API_KEY}`,
      },
      httpsAgent: httpsAgent,
    })
    .catch((error: AxiosError) => {
      plcApiLogger.error(error)
    })
}

function changeRadarState(data: { power: string }) {
  axios
    .put(`${config.CYBER_CITY_API_HOST}/api/radar`, data, {
      headers: {
        'api-key': `${config.CYBER_CITY_API_KEY}`,
      },
      httpsAgent: httpsAgent,
    })
    .catch((error: AxiosError) => {
      plcApiLogger.error(error)
    })
}

function changeRailSwitchState(data: { zone: string; direction: string }) {
  axios
    .put(`${config.CYBER_CITY_API_HOST}/api/railswitch`, data, {
      headers: {
        'api-key': `${config.CYBER_CITY_API_KEY}`,
      },
      httpsAgent: httpsAgent,
    })
    .catch((error: AxiosError) => {
      plcApiLogger.error(error)
    })
}

function changeTrainState(data: { power: string }) {
  axios
    .put(`${config.CYBER_CITY_API_HOST}/api/train`, data, {
      headers: {
        'api-key': `${config.CYBER_CITY_API_KEY}`,
      },
      httpsAgent: httpsAgent,
    })
    .catch((error: AxiosError) => {
      plcApiLogger.error(error)
    })
}

function changeWaterTowerColor(data: { color: string }) {
  axios
    .put(`${config.CYBER_CITY_API_HOST}/api/water`, data, {
      headers: {
        'api-key': `${config.CYBER_CITY_API_KEY}`,
      },
      httpsAgent: httpsAgent,
    })
    .catch((error: AxiosError) => {
      plcApiLogger.error(error)
    })
}

/**
 * Static-purposed class for interacting with the ASCOT API.
 */
export class AscotApi {
  /**
   * The host of the ASCOT API retrieved from the config.
   */
  public static readonly API_HOST: string = config.ASCOT_API_HOST

  /**
   * The endpoint for accessing and managing the entities in ASCOT via the API.
   */
  public static readonly ENTITIES_ENDPOINT: string = `${AscotApi.API_HOST}/api/engen/v1/entities`

  /**
   * Handles various errors by logging to the PLC logger.
   * @param error The error to handle.
   */
  private static handleError = (error: any) => {
    plcApiLogger.error(error)
  }

  /**
   * Cancels any tasks for the entity with the given handle.
   * @param entityHandle The handle of the entity for which to cancel all tasks.
   * @returns A promise that resolves when the request is completed successfully.
   */
  public static cancelAllTasks(entityHandle: string): Promise<void> {
    return axios.post(
      `${AscotApi.ENTITIES_ENDPOINT}/${entityHandle}/tasks/cancel-all/`,
      {
        httpsAgent: httpsAgent,
      },
    )
  }

  /**
   * Determines whether the entity with the given handle has a currently running task.
   * @param entityHandle
   * @returns A promise that resolves with a boolean indicating whether the entity has a currently running task.
   */
  public static hasCurrentTask(entityHandle: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      axios
        .get(`${AscotApi.ENTITIES_ENDPOINT}/${entityHandle}/current-task/`)
        .then((response) => {
          resolve(response.data !== '')
        })
        .catch(reject)
    })
  }

  /**
   * Affects an entity in ASCOT via the API given the provided arguments.
   * @param args Arguments used to affect the entity, found in the assets of node actions.
   * @returns A promise that resolves when the request is completed successfully.
   */
  public static async affectEntity(args: {
    entityName: string
    requestPath: string
    requestMethod: string
    requestData: AnyObject
  }): Promise<void> {
    try {
      // Parse arguments into variables.
      let { entityName, requestPath, requestMethod, requestData } = args
      let entityHandle: string | undefined = undefined

      // Retrieves current list of entities from ASCOT.
      let response = await axios.get(
        `${AscotApi.ENTITIES_ENDPOINT}/?expand=name`,
      )
      let entities: any = response.data

      // Find the entity with the name
      // specified in the arguments.
      for (let entity of entities) {
        if (entity.name === entityName) {
          entityHandle = entity.handle
          break
        }
      }

      // Throw an error if no entity was
      // found.
      if (entityHandle === undefined) {
        throw new Error('No entity found with the given name.')
      }

      // Check if the entity already has a
      // currently running task.
      let hasTask: boolean = await AscotApi.hasCurrentTask(entityHandle)

      // While the entity has a currently running
      // task, cancel all tasks until no running
      // task is found.
      while (hasTask) {
        await AscotApi.cancelAllTasks(entityHandle)
        await sleep(1000)
        hasTask = await AscotApi.hasCurrentTask(entityHandle)
      }

      // Determine which Axios method to use
      // based on the request method passed in
      // the arguments.
      let makeRequest: (
        url: string,
        data?: AnyObject | undefined,
        config?: AxiosRequestConfig<AnyObject> | undefined,
      ) => Promise<AxiosResponse>

      switch (requestMethod) {
        case 'POST':
          makeRequest = axios.post
          break
        case 'PUT':
          makeRequest = axios.put
          break
        case 'PATCH':
          makeRequest = axios.patch
          break
        case 'DELETE':
          makeRequest = axios.delete
          break
        default:
          throw new Error('No valid request method specified.')
      }

      // Make the request to the ASCOT API
      // to affect the entity with the given
      // handle, path, method, and data.
      await makeRequest(
        `${AscotApi.ENTITIES_ENDPOINT}/${entityHandle}/${requestPath}/`,
        requestData,
        {
          httpsAgent: httpsAgent,
        },
      )
    } catch (error) {
      AscotApi.handleError(error)
    }
  }
}

// This is called in the routes-missions on the route "/api/v1/missions/handle-action-execution/"
export const cyberCityCommandScripts: SingleTypeObject<
  (args: AnyObject) => void
> = {
  BankColor: (args: AnyObject) => {
    let data: any = args
    changeBankColor(data)
  },
  TrafficLight: (args: AnyObject) => {
    let data: any = args
    changeTrafficLightColor(data)
  },
  Gas: (args: AnyObject) => {
    let data: any = args
    changeGasState(data)
  },
  LightStrip: (args: AnyObject) => {
    let data: any = args
    changeLightStripState(data)
  },
  BuildingLights: (args: AnyObject) => {
    let data: any = args
    changeBuildingLightColor(data)
  },
  Radar: (args: AnyObject) => {
    let data: any = args
    changeRadarState(data)
  },
  RailSwitch: (args: AnyObject) => {
    let data: any = args
    changeRailSwitchState(data)
  },
  Train: (args: AnyObject) => {
    let data: any = args
    changeTrainState(data)
  },
  WaterTower: (args: AnyObject) => {
    let data: any = args
    changeWaterTowerColor(data)
  },
}

export default {
  cyberCityCommandScripts,
  AscotApi,
}
