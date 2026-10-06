import { handleVerifyPin } from './handler.ts'

Deno.serve((req: Request) => handleVerifyPin(req, Deno.env))
