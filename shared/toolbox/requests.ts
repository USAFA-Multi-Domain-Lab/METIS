import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'

export enum ERequestMethod {
  Get,
  Post,
}

export interface IRequestDetails {
  method: ERequestMethod
  url: string
  data?: any
  config?: AxiosRequestConfig | undefined
  errorMessage?: string | undefined
}

// These are request urls that can be used
// to access the API.
export const ApiRequestUrls = {
  Mission: '/api/v1/mission/',
  MissionHide: '/api/v1/mission/hide/',
  MissionShow: '/api/v1/mission/show/',
  MissionTag: '/api/v1/mission/tag/',
  MissionEnv: '/api/v1/mission/env/',
  MissionEnvBuild: '/api/v1/mission/env/build/',
  MissionEnvTearDown: '/api/v1/mission/env/tear-down/',
  MissionEnvReset: '/api/v1/mission/env/reset/',
  Notification: '/api/v1/notification/',
  NotificationDismiss: '/api/v1/notification/dismiss/',
  NotificationBatch: '/api/v1/notification/batch/',
}

// Making API requests is pretty straight forward
// with Axios, however, since hundreds of functions
// do very similar things, this function will save
// a couple lines in a lot of places.
export function makeApiRequest(
  requestDetails: IRequestDetails,
  callback: (response: AxiosResponse) => void = () => {},
  callbackError: (error: AxiosError) => void = () => {},
): void {
  switch (requestDetails.method) {
    case ERequestMethod.Get:
      axios
        .get(requestDetails.url, {
          ...requestDetails.config,
          params: { ...requestDetails.data },
        })
        .then(callback, (error: AxiosError) => {
          if (requestDetails.errorMessage !== undefined) {
            error.message = requestDetails.errorMessage
          }
          console.error(error)
          callbackError(error)
        })
      break

    case ERequestMethod.Post:
      axios
        .post(requestDetails.url, requestDetails.data, requestDetails.config)
        .then(callback, (error: AxiosError) => {
          if (requestDetails.errorMessage !== undefined) {
            error.message = requestDetails.errorMessage
          }
          console.error(error)
          callbackError(error)
        })
      break

    default:
      console.log(
        new Error(
          "API request defaulted to get request because the request method couldn't be determined.",
        ),
      )
      makeApiRequest(
        {
          ...requestDetails,
          method: ERequestMethod.Get,
        },
        callback,
        callbackError,
      )
  }
}

// This will make a function that calls the makeApiRequest
// function.
export function makeApiRequestFunction<TRequestData, TResponseData>(
  requestDetails: IRequestDetails,
  precallMiddleware: (
    requestData: TRequestData,
    next: (requestData: any) => void,
  ) => void = (requestData, next) => next(requestData),
  callbackMiddleware: (
    responseData: any,
    next: (responseData: TResponseData) => void,
  ) => void = (
    responseData: any,
    next: (responseData: TResponseData) => void,
  ) => next(responseData),
  callbackErrorMiddleware: (
    error: AxiosError,
    next: (error: AxiosError) => void,
  ) => void = (error: AxiosError, next: (error: AxiosError) => void) =>
    next(error),
): (
  requestData: TRequestData,
  callback: (responseData: TResponseData) => void,
  callbackError: (error: AxiosError) => void,
  customErrorMessage?: string | undefined,
) => void {
  const apiRequestFunction = (
    requestData: TRequestData,
    callback: (responseData: TResponseData) => void,
    callbackError: (error: AxiosError) => void,
    customErrorMessage: string | undefined = undefined,
  ) => {
    let call = (requestData: any) => {
      requestDetails.data = {
        ...requestDetails.data,
        ...requestData,
      }
      requestDetails.errorMessage =
        customErrorMessage !== undefined
          ? customErrorMessage
          : requestDetails.errorMessage
      makeApiRequest(
        requestDetails,
        (response: AxiosResponse) =>
          callbackMiddleware(response.data, callback),
        (error: AxiosError) => callbackErrorMiddleware(error, callbackError),
      )
    }
    precallMiddleware(requestData, call)
  }
  return apiRequestFunction
}

const defaultExports = {
  ApiRequestUrls,
  makeApiRequest,
  makeApiRequestFunction,
}

export default defaultExports
