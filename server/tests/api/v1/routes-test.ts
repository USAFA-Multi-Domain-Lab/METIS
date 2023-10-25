import {
  RequestBodyFilters,
  defineRequests,
} from 'metis/server/middleware/requests'
import { TMetisRouterMap } from 'metis/server/http/router'
import expressWs from 'express-ws'

export const routerMap: TMetisRouterMap = (
  router: expressWs.Router,
  done: () => void,
) => {
  // POST route to test the body validation
  // middleware function
  router.post(
    '/request-body-filter-check/',
    defineRequests(
      {
        body: {
          bodyKeys: {
            STRING: RequestBodyFilters.STRING,
            STRING_50_CHAR: RequestBodyFilters.STRING_50_CHAR,
            STRING_128_CHAR: RequestBodyFilters.STRING_128_CHAR,
            STRING_255_CHAR: RequestBodyFilters.STRING_255_CHAR,
            STRING_256_CHAR: RequestBodyFilters.STRING_256_CHAR,
            STRING_512_CHAR: RequestBodyFilters.STRING_512_CHAR,
            STRING_1024_CHAR: RequestBodyFilters.STRING_1024_CHAR,
            STRING_MEDIUMTEXT: RequestBodyFilters.STRING_MEDIUMTEXT,
            NUMBER: RequestBodyFilters.NUMBER,
            OBJECT: RequestBodyFilters.OBJECT,
            OBJECTID: RequestBodyFilters.OBJECTID,
          },
          keys: {
            STRING: RequestBodyFilters.STRING,
          },
        },
      },
      {
        body: {
          bodyKeys: { BOOLEAN: RequestBodyFilters.BOOLEAN },
          keys: { BOOLEAN: RequestBodyFilters.BOOLEAN },
        },
      },
    ),
    (request, response) => {
      let body: any = request.body
      let bodyKeys: any = body.bodyKeys
      return response.send({ bodyKeys })
    },
  )

  // GET route to test the query validation
  // middleware function
  router.get(
    '/request-query-type-check/',
    defineRequests(
      {
        query: {
          number: 'number',
          integer: 'integer',
          boolean: 'boolean',
          objectId: 'objectId',
        },
      },
      { query: { string: 'string' } },
    ),
    (request, response) => {
      let query: any = request.query
      return response.send({ query })
    },
  )

  // GET route to test the params validation
  // middleware function
  router.get(
    '/request-params-type-check/:string/:number/:objectId',
    defineRequests({
      params: {
        string: 'string',
        number: 'number',
        objectId: 'objectId',
      },
    }),
    (request, response) => {
      let params: any = request.params
      return response.send({ params })
    },
  )

  done()
}

export default routerMap
