import z from '@deepseek-ai/schemastery'
import { WebError } from '@deepseek-ai/dsh-web'
import { launchEnvironmentOf } from '@deepseek-ai/dsh-launch-environment'

export const name = 'web-fetch-tavily'
export const inject = ['web']

export const Config = z.object({
  baseURL: z.string().default('https://api.tavily.com').description('Tavily-compatible endpoint root; /extract is appended.').volatile(),
  apiKeyEnv: z.string().role('credential-ref').default('TAVILY_API_KEY').description('Credential reference holding the key (set it on the settings page).').volatile(),
  apiKey: z.string().role('secret').description('Literal key fallback; prefer the credential above.').volatile(),
  extractDepth: z.union(['basic', 'advanced']).default('basic').volatile(),
  format: z.union(['markdown', 'text']).default('markdown').volatile(),
  timeoutSeconds: z.number().step(1).min(1).max(60).default(30).volatile(),
  maxBodyChars: z.number().step(1).min(1).default(100000).volatile(),
})

const err = (m, c) => new WebError(m, 'WEB_PROVIDER_ERROR', c ? { cause: c } : {})

class TavilyFetchProvider {
  id = 'tavily'
  constructor(ctx, config) { this.ctx = ctx; this.config = config }
  async key() {
    const c = this.config
    const ref = c.apiKeyEnv || 'TAVILY_API_KEY'
    const creds = this.ctx.get('credentials')
    const fromCred = creds ? (await creds.resolve(ref))?.value : launchEnvironmentOf(this.ctx).get(ref)?.value
    return fromCred || c.apiKey || ''
  }
  available() { return URL.canParse(this.config.baseURL || '') }
  async ready() { return (await this.key()).length > 0 }
  async fetch(request, signal) {
    const o = this.config
    const apiKey = await this.key()
    if (!apiKey) throw err('Tavily API key is not configured (Plugins > Tavily web fetch)')
    let u
    try { u = new URL(request.url) } catch (e) { throw new WebError(`invalid URL: ${request.url}`, 'WEB_INVALID_URL', { cause: e }) }
    if (!/^https?:$/.test(u.protocol)) throw new WebError('only http and https are fetchable', 'WEB_INVALID_URL')
    if (u.username || u.password) throw new WebError('URL must not carry credentials', 'WEB_INVALID_URL')
    let res
    try {
      res = await fetch(`${o.baseURL.replace(/\/+$/, '')}/extract`, {
        method: 'POST',
        headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ urls: [request.url], extract_depth: o.extractDepth, format: o.format, timeout: o.timeoutSeconds }),
        ...(signal ? { signal } : {}),
      })
    } catch (e) {
      if (e?.name === 'AbortError') throw new WebError('Tavily fetch aborted', 'WEB_ABORTED', { cause: e })
      throw err(`Tavily fetch request failed: ${String(e)}`, e)
    }
    let p
    try { p = await res.json() } catch (e) {
      if (e?.name === 'AbortError') throw new WebError('Tavily fetch aborted', 'WEB_ABORTED', { cause: e })
      throw err(`Tavily fetch failed (HTTP ${res.status})`, e)
    }
    if (!res.ok) {
      const d = p?.detail?.error ?? p?.detail ?? p?.error ?? ''
      throw err(`Tavily fetch failed (HTTP ${res.status})${d ? `: ${typeof d === 'string' ? d : JSON.stringify(d)}` : ''}`)
    }
    const hit = (p.results ?? [])[0]
    if (!hit || typeof hit.raw_content !== 'string' || hit.raw_content.trim() === '') {
      const f = (p.failed_results ?? [])[0]
      throw err(`Tavily could not extract ${request.url}${f?.error ? `: ${f.error}` : ' (empty result)'}`)
    }
    const truncated = hit.raw_content.length > o.maxBodyChars
    const content = truncated ? hit.raw_content.slice(0, o.maxBodyChars) : hit.raw_content
    return { url: hit.url || request.url, statusCode: 200, body: { kind: 'text', content }, truncated }
  }
}

export function apply(ctx, config) {
  ctx.web.registerFetchProvider(new TavilyFetchProvider(ctx, config))
}
