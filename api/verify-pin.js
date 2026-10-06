import { timingSafeEqual, createHash } from 'node:crypto'

const digest = (value) => createHash('sha256').update(String(value)).digest()

const matches = (entered, secret) => {
  if (!secret) return false
  return timingSafeEqual(digest(entered), digest(secret))
}

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ isValid: false, error: 'Method not allowed.' })
  }

  const secrets = [process.env.PIN_PRIMARY, process.env.PIN_SECONDARY].filter(Boolean)
  if (secrets.length === 0) {
    return res.status(500).json({ isValid: false, error: 'PIN not configured. Please contact administrator.' })
  }

  const pin = typeof req.body?.pin === 'string' ? req.body.pin : ''
  const isValid = secrets.map((secret) => matches(pin, secret)).some(Boolean)

  return res.status(200).json({ isValid })
}
