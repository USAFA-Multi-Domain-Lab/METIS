import { expect } from 'chai'
import { testLogger } from 'metis/server/logging'
import { agent } from '../../index.test'

/**
 * Tests for the middleware function used to validate the data sent in the request query of the API routes.
 */
export default function RequestQuery(): Mocha.Suite {
  return describe('Request Query Validation', function () {
    let string: string = 'string'
    let number: number = 3.5
    let integer: number = 3
    let boolean: boolean = true
    let objectId: string = '643ea778c10a4de66a9448d0'

    it('Sending a request with all required and optional query keys and their correct types results in a successful (200) response', async function () {
      try {
        let response = await agent
          .get(`/api/v1/tests/request-query-type-check/`)
          .query({
            string: string,
            number: number,
            integer: integer,
            boolean: boolean,
            objectId: objectId,
          })

        expect(response).to.have.status(200)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Sending a request with all required and optional query keys and their types being incorrect results in a bad request (400) response', async function () {
      try {
        let response = await agent
          .get(`/api/v1/tests/request-query-type-check/`)
          .query({
            string: number,
            number: string,
            integer: number,
            boolean: objectId,
            objectId: boolean,
          })

        expect(response).to.have.status(400)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Sending a request with a missing query key that is required results in a bad request (400) request', async function () {
      try {
        let response = await agent
          .get(`/api/v1/tests/request-query-type-check/`)
          .query({
            string: string,
            number: number,
            integer: integer,
            boolean: boolean,
          })

        expect(response).to.have.status(400)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Sending a request with a missing query key (string) that is optional results in a successful (200) request', async function () {
      try {
        let response = await agent
          .get(`/api/v1/tests/request-query-type-check/`)
          .query({
            number: number,
            integer: integer,
            boolean: boolean,
            objectId: objectId,
          })

        expect(response).to.have.status(200)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Sending a request with additional query keys results in those additional query keys being removed from the request query', async function () {
      try {
        let response = await agent
          .get(`/api/v1/tests/request-query-type-check/`)
          .query({
            number: number,
            integer: integer,
            boolean: boolean,
            objectId: objectId,
            extraKey: 'extra key',
          })

        expect(response).to.have.status(200)
        expect(response.body.query.extraKey).to.equal(undefined)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })
  })
}
