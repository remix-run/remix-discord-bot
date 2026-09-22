import * as http from 'node:http'
import type { AddressInfo } from 'node:net'

import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { startApplication } from './application.ts'
import type { BotConfig } from './bot/config.ts'

const botConfig: BotConfig = {
  applicationId: 'application',
  botToken: '[REDACTED:SECRET]',
  guildId: 'guild',
  botLogsChannelId: 'logs',
  reportsChannelId: 'reports',
  talkToBotsChannelId: 'bots',
  moderatorsRoleId: 'moderators',
}

describe('application lifecycle', () => {
  it('starts HTTP and Discord together, then stops both exactly once', async () => {
    let botStops = 0
    let application = await startApplication({
      botConfig,
      port: 0,
      version: 'test',
      async startBot(_config, status) {
        status.discordReady('Test Remy')
        return {
          async stop() {
            botStops += 1
            status.discordStopped()
          },
        }
      },
    })

    let port = (application.server.address() as AddressInfo).port
    let response = await fetch(`http://127.0.0.1:${port}/healthcheck`)
    assert.deepEqual(await response.json(), { ok: true, discord: 'ready' })

    await application.stop()
    await application.stop()

    assert.equal(botStops, 1)
    assert.equal(application.server.listening, false)
    assert.equal(application.status.snapshot().discord.state, 'stopped')
  })

  it('releases the HTTP port when Discord startup fails', async (test) => {
    let reservation = http.createServer()
    await new Promise<void>((resolve) => reservation.listen(0, '127.0.0.1', resolve))
    let port = (reservation.address() as AddressInfo).port
    await new Promise<void>((resolve, reject) =>
      reservation.close((error) => (error ? reject(error) : resolve())),
    )

    await assert.rejects(
      startApplication({
        botConfig,
        port,
        version: 'test',
        async startBot() {
          throw new Error('login failed')
        },
      }),
      /login failed/,
    )

    let replacement = http.createServer()
    test.after(() => replacement.close())
    await new Promise<void>((resolve, reject) => {
      replacement.once('error', reject)
      replacement.listen(port, '0.0.0.0', resolve)
    })
    assert.equal(replacement.listening, true)
  })
})
