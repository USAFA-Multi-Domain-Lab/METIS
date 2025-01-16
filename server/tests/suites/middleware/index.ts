import RequestBody from './request-body'
import RequestParams from './request-params'
import RequestQuery from './request-query'
import WsValidation from './ws-validation'

/**
 * Executes all of the middleware tests.
 */
export default function Middleware(): void {
  RequestBody()
  RequestQuery()
  RequestParams()
  WsValidation()
}
