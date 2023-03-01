import { IMechanismJSON, Mechanism } from './mechanisms'
import { v4 as generateHash } from 'uuid'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { AnyObject } from './toolbox/objects'

export interface IAssetJSON {
  assetID: string
  name: string
  mechanisms: Array<IMechanismJSON>
}

export class Asset {
  assetID: string
  name: string
  selectedMechanism: Mechanism | null
  mechanisms: Array<Mechanism>

  // static createDefaultMechanism(asset: Asset) {
  //   return new Mechanism(asset, generateHash(), 'Unnamed Mechanism', [], '')
  // }

  constructor(
    assetID: string,
    name: string,
    mechanisms: Array<Mechanism>,
    // ! mechanismJSON: Array<IMechanismJSON>,
  ) {
    this.assetID = assetID
    this.name = name
    this.selectedMechanism = null
    this.mechanisms = mechanisms

    // ! this.parseMechanismJSON(mechanismJSON)
  }

  toJSON(): IAssetJSON {
    return {
      assetID: this.assetID,
      name: this.name,
      mechanisms: this.mechanisms,
    }
  }

  // ! parseMechanismJSON(mechanismJSON: Array<IMechanismJSON>): void {
  //   let mechanisms: Array<Mechanism> = []

  //   for (let mechanism of mechanismJSON) {
  //     let mechanismObject: Mechanism = new Mechanism(
  //       this,
  //       mechanism.mechanismID,
  //       mechanism.name,
  //       mechanism.states,
  //       mechanism.selectedState,
  //     )
  //     mechanisms.push(mechanismObject)
  //   }

  //   this.mechanisms = mechanisms
  // }
}

export function getAsset(
  assetID: string,
  callback: (asset: Asset) => void,
  callbackError: (error: AxiosError) => void,
): void {
  axios
    .get(`/api/v1/assets?assetID=${assetID}`)
    .then((response: AxiosResponse<AnyObject>): void => {
      let assetJson = response.data.asset

      let asset = new Asset(
        assetJson.assetID,
        assetJson.name,
        assetJson.mechanisms,
      )

      callback(asset)
    })
    .catch((error: AxiosError) => {
      console.error('Failed to retrieve asset.')
      console.error(error)
      callbackError(error)
    })
}

export function getAllAssets(
  callback: (assets: Array<Asset>) => void,
  callbackError: (error: AxiosError) => void,
) {
  axios
    .get(`/api/v1/assets`)
    .then((response: AxiosResponse) => {
      let assetsJson = response.data.assets

      callback(assetsJson)
    })
    .catch((error: AxiosError) => {
      console.error('Failed to retrieve assets.')
      console.error(error)
      callbackError(error)
    })
}

export default { Asset, getAsset, getAllAssets }
