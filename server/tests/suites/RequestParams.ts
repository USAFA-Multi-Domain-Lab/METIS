import { expect } from 'chai'
import { testLogger } from '../../logging'
import { agent } from '../index.test'

/**
 * Tests for the middleware function used to validate the data sent in the request params of the API routes.
 */
export default function RequestParams(): Mocha.Suite {
  return describe('Request Params Validation', function () {
    let string: string = 'string'
    let number: number = 3.5
    let objectId: string = '6532b0b5978db2d9540048fa'

    it('Sending a request with all params keys and their correct types results in a successful (200) response', async function () {
      try {
        let response = await agent.get(
          `/api/v1/tests/request-params-type-check/${string}/${number}/${objectId}`,
        )

        expect(response).to.have.status(200)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Sending a request with all params keys and their types being incorrect results in a bad request (400) response', async function () {
      try {
        let response = await agent.get(
          `/api/v1/tests/request-params-type-check/${objectId}/${string}/${number}`,
        )

        expect(response).to.have.status(400)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Sending a request with a missing params key (OBJECTID) results in a not found (404) request', async function () {
      try {
        let response = await agent.get(
          `/api/v1/tests/request-params-type-check/${string}/${number}/`,
        )

        expect(response).to.have.status(404)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })
  })
}
