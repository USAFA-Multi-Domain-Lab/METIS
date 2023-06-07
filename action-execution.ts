import { AnyObject, SingleTypeObject } from './modules/toolbox/objects'
import axios, { AxiosError } from 'axios'
import config from './config'
import https from 'https'
import { plcApiLogger } from './modules/logging'

const httpsAgent = new https.Agent({ rejectUnauthorized: false })

export function changeBankColor(data: { color: string }) {
  axios
    .put(`${config.PLC_API_HOST}/api/bank`, data, {
      headers: {
        'api-key': `${config.API_KEY}`,
      },
      httpsAgent: httpsAgent,
    })
    .catch((error: AxiosError) => {
      plcApiLogger.error(error)
    })
}

export function changeTrafficLightColor(data: {
  zone: string
  direction: string
  color: string
  power: string
}) {
  axios
    .put(`${config.PLC_API_HOST}/api/traffic`, data, {
      headers: {
        'api-key': `${config.API_KEY}`,
      },
      httpsAgent: httpsAgent,
    })
    .catch((error: AxiosError) => {
      plcApiLogger.error(error)
    })
}

export function changeGasState(data: { power: string; section?: string }) {
  axios
    .put(`${config.PLC_API_HOST}/api/gas`, data, {
      headers: {
        'api-key': `${config.API_KEY}`,
      },
      httpsAgent: httpsAgent,
    })
    .catch((error: AxiosError) => {
      plcApiLogger.error(error)
    })
}

export function changeLightStripState(data: { power: string }) {
  axios
    .put(`${config.PLC_API_HOST}/api/lstrip`, data, {
      headers: {
        'api-key': `${config.API_KEY}`,
      },
      httpsAgent: httpsAgent,
    })
    .catch((error: AxiosError) => {
      plcApiLogger.error(error)
    })
}

export function changeBuildingLightColor(data: {
  building: string
  power: string
}) {
  axios
    .put(`${config.PLC_API_HOST}/api/lights`, data, {
      headers: {
        'api-key': `${config.API_KEY}`,
      },
      httpsAgent: httpsAgent,
    })
    .catch((error: AxiosError) => {
      plcApiLogger.error(error)
    })
}

export function changeRadarState(data: { power: string }) {
  axios
    .put(`${config.PLC_API_HOST}/api/radar`, data, {
      headers: {
        'api-key': `${config.API_KEY}`,
      },
      httpsAgent: httpsAgent,
    })
    .catch((error: AxiosError) => {
      plcApiLogger.error(error)
    })
}

export function changeRailSwitchState(data: {
  zone: string
  direction: string
}) {
  axios
    .put(`${config.PLC_API_HOST}/api/railswitch`, data, {
      headers: {
        'api-key': `${config.API_KEY}`,
      },
      httpsAgent: httpsAgent,
    })
    .catch((error: AxiosError) => {
      plcApiLogger.error(error)
    })
}

export function changeTrainState(data: { power: string }) {
  axios
    .put(`${config.PLC_API_HOST}/api/train`, data, {
      headers: {
        'api-key': `${config.API_KEY}`,
      },
      httpsAgent: httpsAgent,
    })
    .catch((error: AxiosError) => {
      plcApiLogger.error(error)
    })
}

export function changeWaterTowerColor(data: { color: string }) {
  axios
    .put(`${config.PLC_API_HOST}/api/water`, data, {
      headers: {
        'api-key': `${config.API_KEY}`,
      },
      httpsAgent: httpsAgent,
    })
    .catch((error: AxiosError) => {
      plcApiLogger.error(error)
    })
}

// This is called in the routes-missions on the route "/api/v1/missions/handle-action-execution/"
export const commandScripts: SingleTypeObject<(args: AnyObject) => void> = {
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
  commandScripts,
}
