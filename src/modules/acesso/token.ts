import { createPublicKey, verify, type JsonWebKeyInput } from 'node:crypto'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { z } from 'zod'

const claimsSchema = z.object({
  sub: z.uuid(), iss: z.string(), aud: z.union([z.string(), z.array(z.string())]),
  exp: z.number(), nbf: z.number().optional(),
  tenant_id: z.uuid().optional(),
  app_metadata: z.object({ tenant_id: z.uuid().optional() }).optional(),
})
const cabecalhoSchema = z.object({ alg: z.enum(['RS256', 'ES256']), kid: z.string() })
type Chave = JsonWebKeyInput['key'] & { kid: string; alg?: string; use?: string }

/** Valida JWT por JWKS sem aceitar algoritmos simétricos ou tenant do navegador. */
@Injectable()
export class Token {
  private chaves: Chave[] = []
  private validoAte = 0

  async validar(token: string) {
    try {
      const partes = token.split('.')
      if (partes.length !== 3) throw new Error('Formato inválido')
      const [h, p, assinatura] = partes
      const header = cabecalhoSchema.parse(JSON.parse(Buffer.from(h, 'base64url').toString()))
      const claims = claimsSchema.parse(JSON.parse(Buffer.from(p, 'base64url').toString()))
      const issuer = `${process.env.SUPABASE_URL?.replace(/\/$/, '')}/auth/v1`
      const agora = Date.now() / 1000
      const audiencia = Array.isArray(claims.aud) ? claims.aud : [claims.aud]
      if (claims.iss !== issuer || !audiencia.includes('authenticated') || claims.exp <= agora || (claims.nbf && claims.nbf > agora)) throw new Error('Claims inválidos')
      const chave = await this.chave(header.kid, issuer)
      if (chave.alg && chave.alg !== header.alg) throw new Error('Algoritmo inválido')
      if (chave.use && chave.use !== 'sig') throw new Error('Uso inválido')
      if ((header.alg === 'RS256' && chave.kty !== 'RSA') || (header.alg === 'ES256' && (chave.kty !== 'EC' || chave.crv !== 'P-256'))) throw new Error('Chave inválida')
      const key = createPublicKey({ key: chave, format: 'jwk' })
      const ok = verify('sha256', Buffer.from(`${h}.${p}`), { key, dsaEncoding: 'ieee-p1363' }, Buffer.from(assinatura, 'base64url'))
      if (!ok) throw new Error('Assinatura inválida')
      const tenantId = claims.app_metadata?.tenant_id ?? claims.tenant_id
      if (!tenantId) throw new Error('Tenant ausente no token')
      return { userId: claims.sub, tenantId }
    } catch {
      throw new UnauthorizedException('Sessão inválida ou expirada')
    }
  }

  private async chave(kid: string, issuer: string): Promise<Chave> {
    if (Date.now() >= this.validoAte || !this.chaves.some((k) => k.kid === kid)) {
      const response = await fetch(`${issuer}/.well-known/jwks.json`, { signal: AbortSignal.timeout(5000) })
      if (!response.ok) throw new Error('JWKS indisponível')
      const body = await response.json()
      if (!Array.isArray(body.keys)) throw new Error('JWKS inválido')
      this.chaves = body.keys
      this.validoAte = Date.now() + 600000
    }
    const chave = this.chaves.find((k) => k.kid === kid)
    if (!chave) throw new Error('Chave desconhecida')
    return chave
  }
}
