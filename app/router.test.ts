import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { createAppRouter } from './router.ts'
import { routes } from './routes.ts'
import { RuntimeStatus } from './runtime.ts'

describe('HTTP routes', () => {
  it('returns the runtime status at the route contract URL', async () => {
    let status = new RuntimeStatus({
      version: '3.0.0',
      startedAt: new Date('2026-01-01T00:00:00.000Z'),
      commitSha: 'abc123',
    })
    status.discordReady('Remy#0000')
    let router = createAppRouter(status)

    let response = await router.fetch(new Request(`http://localhost${routes.home.href()}`))

    assert.equal(response.status, 200)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    assert.deepEqual(await response.json(), {
      name: 'Remy',
      version: '3.0.0',
      startedAt: '2026-01-01T00:00:00.000Z',
      commitSha: 'abc123',
      discord: { state: 'ready', username: 'Remy#0000' },
    })
  })

  it('keeps the process healthcheck available while reporting Discord state', async () => {
    let status = new RuntimeStatus({ version: 'test' })
    let router = createAppRouter(status)

    let response = await router.fetch(
      new Request(`http://localhost${routes.healthcheck.href()}`),
    )

    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { ok: true, discord: 'starting' })
  })

  it('returns 404 outside the declared routes', async () => {
    let router = createAppRouter(new RuntimeStatus({ version: 'test' }))
    let response = await router.fetch(new Request('http://localhost/nope'))
    assert.equal(response.status, 404)
  })
})
