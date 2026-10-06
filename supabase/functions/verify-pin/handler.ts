// PIN check for the Supabase Edge Function in index.ts.
// The two PINs come from the function's secrets (PIN_PRIMARY and PIN_SECONDARY),
// so they never appear in the app bundle, the repo or the database.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  })

const sha256 = async (value: string) =>
  new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))

// Compare fixed-length digests so the time taken does not depend on how many characters match.
const matches = async (entered: string, secret: string) => {
  const [a, b] = await Promise.all([sha256(entered), sha256(secret)])
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

export const handleVerifyPin = async (
  req: Request,
  env: { get(key: string): string | undefined }
): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ valid: false, error: 'Method not allowed.' }, 405)

  const secrets = [env.get('PIN_PRIMARY'), env.get('PIN_SECONDARY')].filter((s): s is string => !!s)
  if (secrets.length === 0) {
    return json({ valid: false, error: 'PIN not configured. Please contact administrator.' })
  }

  let pin = ''
  try {
    const body = await req.json()
    pin = typeof body?.pin === 'string' ? body.pin : ''
  } catch {
    return json({ valid: false, error: 'Invalid request.' }, 400)
  }

  const results = await Promise.all(secrets.map((secret) => matches(pin, secret)))
  return json({ valid: results.some(Boolean) })
}
