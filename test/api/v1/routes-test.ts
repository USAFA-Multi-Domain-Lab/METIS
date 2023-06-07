import express from 'express'
import validateRequestBodyKeys, {
  RequestBodyFilters,
  validateRequestQueryKeys,
} from '../../../modules/requests'

//fields
const router = express.Router()

// POST route to test the body validation
// middleware function
router.post(
  '/request-body-filter-check/',
  validateRequestBodyKeys(
    {
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
    { BOOLEAN: RequestBodyFilters.BOOLEAN },
  ),
  (request, response) => {
    return response.sendStatus(200)
  },
)

// GET route to test the query validation
// middleware function
router.get(
  '/request-query-type-check/',
  validateRequestQueryKeys({
    string: 'string',
    number: 'number',
    integer: 'integer',
    boolean: 'boolean',
    objectId: 'objectId',
  }),
  (request, response) => {
    return response.sendStatus(200)
  },
)

module.exports = router
