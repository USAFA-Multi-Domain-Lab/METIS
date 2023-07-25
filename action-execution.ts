import { AnyObject, SingleTypeObject } from './modules/toolbox/objects'
import axios, { AxiosError } from 'axios'
import config from './config'
import https from 'https'
import { plcApiLogger } from './modules/logging'

const httpsAgent = new https.Agent({ rejectUnauthorized: false })

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

function changeChengduGJ_2(data: {
  asset: string
  heading?: { unit: string; value: string }
  altitude?: { unit: string; value: string }
  kill?: {}
}) {
  if (data.heading) {
    // Cancels all current tasks
    axios
      .post(
        `${config.ASCOT_API_HOST}/api/engen/v1/entities/${data.asset}/tasks/cancel-all/`,
        {
          httpsAgent: httpsAgent,
        },
      )
      .catch((error: AxiosError) => {
        plcApiLogger.error(error)
      })

    // Sets the heading
    axios
      .patch(
        `${config.ASCOT_API_HOST}/api/engen/v1/entities/${data.asset}/heading/`,
        { heading: data.heading },
        {
          httpsAgent: httpsAgent,
        },
      )
      .catch((error: AxiosError) => {
        plcApiLogger.error(error)
      })
  }

  if (data.altitude) {
    // Cancels all current tasks
    axios
      .post(
        `${config.ASCOT_API_HOST}/api/engen/v1/entities/${data.asset}/tasks/cancel-all/`,
        {
          httpsAgent: httpsAgent,
        },
      )
      .catch((error: AxiosError) => {
        plcApiLogger.error(error)
      })

    // Sets the altitude
    axios
      .patch(
        `${config.ASCOT_API_HOST}/api/engen/v1/entities/${data.asset}/altitude/`,
        { altitude: data.altitude },
        {
          httpsAgent: httpsAgent,
        },
      )
      .catch((error: AxiosError) => {
        plcApiLogger.error(error)
      })
  }

  if (data.kill) {
    // Cancels all current tasks
    axios
      .post(
        `${config.ASCOT_API_HOST}/api/engen/v1/entities/${data.asset}/tasks/cancel-all/`,
        {
          httpsAgent: httpsAgent,
        },
      )
      .catch((error: AxiosError) => {
        plcApiLogger.error(error)
      })

    // Kills the asset
    axios
      .post(
        `${config.ASCOT_API_HOST}/api/engen/v1/entities/${data.asset}/kill/`,
        { kill: data.kill },
        {
          httpsAgent: httpsAgent,
        },
      )
      .catch((error: AxiosError) => {
        plcApiLogger.error(error)
      })
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

export const ascotCommandScripts: SingleTypeObject<(args: AnyObject) => void> =
  {
    ChengduGJ_2: (args: AnyObject) => {
      let data: any = args

      // Grabs the asset handle and performs the action
      axios
        .get(`${config.ASCOT_API_HOST}/api/engen/v1/entities?expand=name`)
        .then((response) => {
          let assetData: any = response.data
          let assets: any = {}

          // Grabs and creates an object where the key is the asset name
          // and the value is the asset handle
          for (let assetDatum of assetData) {
            let name = assetDatum.name
            let handle = assetDatum.handle
            assets[name] = handle
          }

          // Changes the asset name to the asset handle
          // to be used for the API route
          data.asset = assets[data.asset]

          plcApiLogger.info(data.asset)

          // Performs the action via the API
          changeChengduGJ_2(data)
        })
        .catch((error: AxiosError) => {
          plcApiLogger.error(error)
        })
    },
  }

export default {
  cyberCityCommandScripts,
  ascotCommandScripts,
}
