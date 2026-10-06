import { describe, expect, it } from 'vitest'
import { describeError } from '../src/utils/errors'

describe('describeError', () => {
  it('says so when the device is offline, whatever the error was', () => {
    expect(describeError(new Error('boom'), false)).toMatch(/offline/)
  })

  it('explains timeouts', () => {
    const timeout = Object.assign(new Error('The operation was aborted due to timeout'), { name: 'TimeoutError' })
    expect(describeError(timeout, true)).toMatch(/too long/)
    expect(describeError(Object.assign(new Error('x'), { name: 'AbortError' }), true)).toMatch(/too long/)
  })

  it('explains network failures', () => {
    expect(describeError(new TypeError('Failed to fetch'), true)).toMatch(/Can't reach the server/)
    expect(describeError(new TypeError('Load failed'), true)).toMatch(/Can't reach the server/)
  })

  it('points at migrations when a database function or column is missing', () => {
    expect(describeError({ code: 'PGRST202', message: 'Could not find the function' }, true)).toMatch(/migrations/)
    expect(describeError({ code: '42883', message: 'function does not exist' }, true)).toMatch(/migrations/)
    expect(describeError({ code: 'PGRST205', message: 'Could not find the table' }, true)).toMatch(/migrations/)
  })

  it('passes through other database messages and handles empty errors', () => {
    expect(describeError({ message: 'Service order 123 not found' }, true)).toBe('Service order 123 not found')
    expect(describeError(null, true)).toMatch(/Something went wrong/)
    expect(describeError({}, true)).toMatch(/Something went wrong/)
  })
})
