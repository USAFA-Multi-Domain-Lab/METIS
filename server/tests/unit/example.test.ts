/**
 * Example test file to demonstrate Jest setup
 */

describe('Example Test Suite', () => {
  describe('Basic Tests', () => {
    it('should pass a simple assertion', () => {
      expect(true).toBe(true)
    })

    it('should perform basic math', () => {
      const sum = 2 + 2
      expect(sum).toBe(4)
    })
  })

  describe('Async Tests', () => {
    it('should handle async operations', async () => {
      const result = await Promise.resolve('success')
      expect(result).toBe('success')
    })
  })

  describe('Mocking', () => {
    it('should mock a function', () => {
      const mockFn = jest.fn()
      mockFn('test')

      expect(mockFn).toHaveBeenCalledWith('test')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })
  })
})
