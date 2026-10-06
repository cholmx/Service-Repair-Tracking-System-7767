import { describe, expect, it } from 'vitest'
import { handleVerifyPin } from '../supabase/functions/verify-pin/handler.ts'

const env = (vars) => ({ get: (key) => vars[key] })
const secrets = env({ PIN_PRIMARY: '4821', PIN_SECONDARY: '7305' })

const post = (pin) =>
  new Request('http://localhost/verify-pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin })
  })

const call = async (req, e = secrets) => {
  const res = await handleVerifyPin(req, e, 0)
  return { status: res.status, body: await res.json() }
}

describe('verify-pin function', () => {
  it('accepts either secret PIN', async () => {
    expect((await call(post('4821'))).body.valid).toBe(true)
    expect((await call(post('7305'))).body.valid).toBe(true)
  })

  it('rejects wrong, empty and missing PINs', async () => {
    expect((await call(post('0000'))).body.valid).toBe(false)
    expect((await call(post(''))).body.valid).toBe(false)
    expect((await call(post(undefined))).body.valid).toBe(false)
  })

  it('does not accept the old hardcoded or default PINs', async () => {
    expect((await call(post('9300'))).body.valid).toBe(false)
    expect((await call(post('1234'))).body.valid).toBe(false)
  })

  it('works when only one secret is set', async () => {
    const one = env({ PIN_PRIMARY: '4821' })
    expect((await call(post('4821'), one)).body.valid).toBe(true)
    expect((await call(post('7305'), one)).body.valid).toBe(false)
  })

  it('reports when no secrets are configured and never accepts an empty PIN', async () => {
    const none = env({})
    const result = await call(post(''), none)
    expect(result.body.valid).toBe(false)
    expect(result.body.error).toMatch(/not configured/)
  })

  it('rejects non-POST requests and malformed bodies', async () => {
    expect((await call(new Request('http://localhost/verify-pin'))).status).toBe(405)
    const bad = new Request('http://localhost/verify-pin', { method: 'POST', body: 'not json' })
    expect((await call(bad)).status).toBe(400)
  })

  it('answers CORS preflight requests', async () => {
    const res = await handleVerifyPin(new Request('http://localhost/verify-pin', { method: 'OPTIONS' }), secrets, 0)
    expect(res.status).toBe(200)
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*')
  })
})
