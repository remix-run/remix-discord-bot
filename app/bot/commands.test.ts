import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { commandDefinitions, createCommandReply } from './commands.ts'

describe('slash commands', () => {
  it('publishes only help and info', () => {
    assert.deepEqual(
      commandDefinitions.map((command) => ({ name: command.name, description: command.description })),
      [
        { name: 'help', description: 'Show Remy bot help.' },
        { name: 'info', description: 'Show Remy runtime information.' },
      ],
    )
  })

  it('documents slash commands and all reaction features', () => {
    let reply = createCommandReply('help', {
      startedAt: new Date(0),
      version: 'test',
    })
    assert.ok(reply)
    let body = JSON.stringify(reply)
    assert.match(body, /\/help/)
    assert.match(body, /botreport/)
    assert.match(body, /botthreadask/)
  })

  it('reports deterministic runtime information', () => {
    let reply = createCommandReply('info', {
      startedAt: new Date('2026-01-01T00:00:00.000Z'),
      version: '3.0.0',
      commitSha: 'abc123',
    })
    assert.ok(reply)
    let body = JSON.stringify(reply)
    assert.match(body, /3\.0\.0/)
    assert.match(body, /abc123/)
    assert.match(body, /<t:1767225600:R>/)
  })

  it('rejects commands outside the published surface', () => {
    assert.equal(
      createCommandReply('unknown', { startedAt: new Date(0), version: 'test' }),
      null,
    )
  })
})
