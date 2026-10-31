// Decode a JWT payload for display only. Never trust these claims for
// authorization in the browser; the backend must verify the signature
// against the user pool's JWKS.
export function decodeJwt(token: string): Record<string, unknown> {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes))
}
