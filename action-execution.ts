import { SingleTypeObject } from './modules/toolbox/objects'
import axios, { AxiosError } from 'axios'
import config from './config'
import https from 'https'

const httpsAgent = new https.Agent({ rejectUnauthorized: false })

export function updateBankAsset(value: string) {
  axios
    .put(
      `${config.PLC_API_HOST}/api/bank`,
      { color: `${value}` },
      {
        headers: {
          'api-key': `${config.API_KEY}`,
        },
        httpsAgent: httpsAgent,
      },
    )
    .catch((error: AxiosError) => {
      console.error(error)
    })
}

export const commandScripts: SingleTypeObject<(value: string) => void> = {
  BankColor: (value: string) => {
    updateBankAsset(value)
  },
}

export default {
  commandScripts,
}
