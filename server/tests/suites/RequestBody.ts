import { expect } from 'chai'
import { testLogger } from '../../logging'
import { agent } from '../index.test'

/**
 * Tests for the middleware function used to validate the data sent in the request body of the API routes.
 */
export default function RequestBody(): Mocha.Suite {
  return describe('Request Body Validation', function () {
    let STRING = '*'
    let STRING_50_CHAR = '*'.repeat(50)
    let STRING_128_CHAR = '*'.repeat(128)
    let STRING_255_CHAR = '*'.repeat(255)
    let STRING_256_CHAR = '*'.repeat(256)
    let STRING_512_CHAR = '*'.repeat(512)
    let STRING_1024_CHAR = '*'.repeat(1024)
    let STRING_MEDIUMTEXT = '*'.repeat(10000)
    let NUMBER = 2
    let BOOLEAN = true
    let OBJECT = { string: 'string' }
    let OBJECTID = '643ea778c10a4de66a9448d0'

    it('Sending a request with all required and optional body keys and their correct types results in a successful (200) response', async function () {
      try {
        let response = await agent
          .post('/api/v1/tests/request-body-filter-check/')
          .set('Content-Type', 'application/json')
          .send({
            bodyKeys: {
              STRING: STRING,
              STRING_50_CHAR: STRING_50_CHAR,
              STRING_128_CHAR: STRING_128_CHAR,
              STRING_255_CHAR: STRING_255_CHAR,
              STRING_256_CHAR: STRING_256_CHAR,
              STRING_512_CHAR: STRING_512_CHAR,
              STRING_1024_CHAR: STRING_1024_CHAR,
              STRING_MEDIUMTEXT: STRING_MEDIUMTEXT,
              NUMBER: NUMBER,
              BOOLEAN: BOOLEAN,
              OBJECT: OBJECT,
              OBJECTID: OBJECTID,
            },
            keys: {
              STRING: STRING,
              BOOLEAN: BOOLEAN,
            },
          })

        expect(response).to.have.status(200)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Sending a request with all required and optional body keys and their types being incorrect results in a bad request (400) response', async function () {
      try {
        let response = await agent
          .post('/api/v1/tests/request-body-filter-check/')
          .set('Content-Type', 'application/json')
          .send({
            bodyKeys: {
              STRING: NUMBER,
              STRING_50_CHAR: STRING_128_CHAR,
              STRING_128_CHAR: STRING_255_CHAR,
              STRING_255_CHAR: STRING_256_CHAR,
              STRING_256_CHAR: STRING_512_CHAR,
              STRING_512_CHAR: STRING_1024_CHAR,
              STRING_1024_CHAR: STRING_MEDIUMTEXT,
              STRING_MEDIUMTEXT: NUMBER,
              NUMBER: BOOLEAN,
              BOOLEAN: STRING,
              OBJECT: OBJECTID,
              OBJECTID: OBJECT,
            },
            keys: {
              STRING: BOOLEAN,
              BOOLEAN: STRING,
            },
          })

        expect(response).to.have.status(400)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Sending a request with a missing body key (OBJECTID) that is required results in a bad request (400) request', async function () {
      try {
        let response = await agent
          .post('/api/v1/tests/request-body-filter-check/')
          .set('Content-Type', 'application/json')
          .send({
            bodyKeys: {
              STRING: STRING,
              STRING_50_CHAR: STRING_50_CHAR,
              STRING_128_CHAR: STRING_128_CHAR,
              STRING_255_CHAR: STRING_255_CHAR,
              STRING_256_CHAR: STRING_256_CHAR,
              STRING_512_CHAR: STRING_512_CHAR,
              STRING_1024_CHAR: STRING_1024_CHAR,
              STRING_MEDIUMTEXT: STRING_MEDIUMTEXT,
              NUMBER: NUMBER,
              BOOLEAN: BOOLEAN,
              OBJECT: OBJECT,
            },
            keys: {
              STRING: STRING,
              BOOLEAN: BOOLEAN,
            },
          })

        expect(response).to.have.status(400)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Sending a request with a missing body key (BOOLEAN) that is optional results in a successful (200) request', async function () {
      try {
        let response = await agent
          .post('/api/v1/tests/request-body-filter-check/')
          .set('Content-Type', 'application/json')
          .send({
            bodyKeys: {
              STRING: STRING,
              STRING_50_CHAR: STRING_50_CHAR,
              STRING_128_CHAR: STRING_128_CHAR,
              STRING_255_CHAR: STRING_255_CHAR,
              STRING_256_CHAR: STRING_256_CHAR,
              STRING_512_CHAR: STRING_512_CHAR,
              STRING_1024_CHAR: STRING_1024_CHAR,
              STRING_MEDIUMTEXT: STRING_MEDIUMTEXT,
              NUMBER: NUMBER,
              OBJECT: OBJECT,
              OBJECTID: OBJECTID,
            },
            keys: {
              STRING: STRING,
            },
          })

        expect(response).to.have.status(200)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })

    it('Sending a request with additional body keys results in those additional body keys being removed from the request body', async function () {
      try {
        let response = await agent
          .post('/api/v1/tests/request-body-filter-check/')
          .set('Content-Type', 'application/json')
          .send({
            bodyKeys: {
              STRING: STRING,
              STRING_50_CHAR: STRING_50_CHAR,
              STRING_128_CHAR: STRING_128_CHAR,
              STRING_255_CHAR: STRING_255_CHAR,
              STRING_256_CHAR: STRING_256_CHAR,
              STRING_512_CHAR: STRING_512_CHAR,
              STRING_1024_CHAR: STRING_1024_CHAR,
              STRING_MEDIUMTEXT: STRING_MEDIUMTEXT,
              NUMBER: NUMBER,
              BOOLEAN: BOOLEAN,
              OBJECT: OBJECT,
              OBJECTID: OBJECTID,
              EXTRA_KEY: 'extra key',
            },
            keys: {
              STRING: STRING,
              BOOLEAN: BOOLEAN,
            },
          })

        expect(response).to.have.status(200)
        expect(response.body.bodyKeys.EXTRA_KEY).to.equal(undefined)
      } catch (error: any) {
        testLogger.error(error)
        throw error
      }
    })
  })
}
