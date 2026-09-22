import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { RuntimeStatus } from './runtime.ts'

describe('runtime status', () => {
  it('tracks the Discord lifecycle without exposing internals', () => {
    let status = new RuntimeStatus({
      version: 'test',
      startedAt: new Date('2026-01-01T00:00:00.000Z'),
    })

    assert.equal(status.snapshot().discord.state, 'starting')
    status.discordReady('Remy')
    assert.deepEqual(status.snapshot().discord, { state: 'ready', username: 'Remy' })
    status.discordError()
    assert.deepEqual(status.snapshot().discord, { state: 'error' })
    status.discordStopped()
    assert.deepEqual(status.snapshot().discord, { state: 'stopped' })
  })
})
