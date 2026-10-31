import { describe, expect, it } from 'vitest'
import { jwt } from '../test/auth'
import { decodeJwt } from './jwt'

describe('decodeJwt', () => {
  it('returns the payload claims', () => {
    const claims = { sub: 'abc', 'cognito:groups': ['admin'], exp: 123 }
    expect(decodeJwt(jwt(claims))).toEqual(claims)
  })

  it('decodes base64url characters and UTF-8 text', () => {
    // '?>' encodes to '-'/'_' in base64url; the name exercises multi-byte UTF-8
    const claims = { name: 'Zoë 東京', note: '?>?>?>' }
    expect(decodeJwt(jwt(claims))).toEqual(claims)
  })

  it('throws on a token without a payload segment', () => {
    expect(() => decodeJwt('not-a-jwt')).toThrow()
  })
})
