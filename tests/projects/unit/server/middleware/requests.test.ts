import { describe, expect, jest, test } from '@jest/globals'
import defineRequests, { RequestBodyFilters } from '@server/middleware/requests'

describe('defineRequests', () => {
  test('Sanitizes body/query/params and calls next() when valid', () => {
    let middleware = defineRequests(
      {
        body: {
          username: RequestBodyFilters.STRING,
        },
        query: {
          isActive: 'boolean',
        },
        params: {
          _id: 'objectId',
        },
      },
      {
        body: {
          optionalName: RequestBodyFilters.STRING_50_CHAR,
        },
        query: {
          limit: 'integer',
        },
      },
    )

    let request: any = {
      body: {
        username: 'alice',
        optionalName: 'Alice',
        extra: 'should be stripped',
      },
      query: {
        isActive: 'true',
        limit: '10',
        extra: 'should be stripped',
      },
      params: {
        _id: '507f1f77bcf86cd799439011',
        extra: 'should be stripped',
      },
    }

    let status = jest.fn().mockReturnThis()
    let send = jest.fn().mockReturnThis()
    let response: any = {
      status,
      send,
      statusMessage: '',
    }

    let next = jest.fn()

    middleware(request, response, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(status).not.toHaveBeenCalled()
    expect(send).not.toHaveBeenCalled()

    expect(request.body).toEqual({
      username: 'alice',
      optionalName: 'Alice',
    })

    expect(request.query).toEqual({
      isActive: 'true',
      limit: '10',
    })

    expect(request.params).toEqual({
      _id: '507f1f77bcf86cd799439011',
    })
  })

  test('Returns 400 and does not call next() when a required body key is missing', () => {
    let middleware = defineRequests({
      body: {
        username: RequestBodyFilters.STRING,
      },
    })

    let request: any = {
      body: {},
      query: {},
      params: {},
    }

    let status = jest.fn().mockReturnThis()
    let send = jest.fn().mockReturnThis()
    let response: any = {
      status,
      send,
      statusMessage: '',
    }

    let next = jest.fn()

    middleware(request, response, next)

    expect(next).not.toHaveBeenCalled()
    expect(status).toHaveBeenCalledWith(400)
    expect(send).toHaveBeenCalled()
    expect(typeof response.statusMessage).toBe('string')
    expect(response.statusMessage.length).toBeGreaterThan(0)
  })

  test('Returns 400 and does not call next() when a param fails validation', () => {
    let middleware = defineRequests({
      params: {
        _id: 'objectId',
      },
    })

    let request: any = {
      body: {},
      query: {},
      params: {
        _id: 'not-an-objectid',
      },
    }

    let status = jest.fn().mockReturnThis()
    let send = jest.fn().mockReturnThis()
    let response: any = {
      status,
      send,
      statusMessage: '',
    }

    let next = jest.fn()

    middleware(request, response, next)

    expect(next).not.toHaveBeenCalled()
    expect(status).toHaveBeenCalledWith(400)
    expect(send).toHaveBeenCalled()
    expect(response.statusMessage).toContain('params-key-type-required')
  })

  test('Returns 400 and does not call next() when a nested required body key is missing', () => {
    let middleware = defineRequests({
      body: {
        config: {
          name: RequestBodyFilters.STRING,
        },
      },
    })

    let request: any = {
      body: {
        config: {},
      },
      query: {},
      params: {},
    }

    let status = jest.fn().mockReturnThis()
    let send = jest.fn().mockReturnThis()
    let response: any = {
      status,
      send,
      statusMessage: '',
    }

    let next = jest.fn()

    middleware(request, response, next)

    expect(next).not.toHaveBeenCalled()
    expect(status).toHaveBeenCalledWith(400)
    expect(send).toHaveBeenCalled()
    expect(response.statusMessage).toContain('config.name')
  })
})
