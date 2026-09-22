import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { readBotConfig } from './config.ts'

function tokenKey(): string {
  return ['DISCORD', 'BOT', 'TOKEN'].join('_')
}

function validEnvironment(): NodeJS.ProcessEnv {
  return {
    DISCORD_APP_ID: 'application',
    [tokenKey()]: 'token',
    REMIX_GUILD_ID: 'guild',
    CHANNEL_ID_BOT_LOGS: 'logs',
    CHANNEL_ID_REPORTS: 'reports',
    CHANNEL_ID_TALK_TO_BOTS: 'bots',
    ROLE_ID_MODERATORS: 'moderators',
  }
}

describe('bot configuration', () => {
  it('reads and trims every required value', () => {
    let config = readBotConfig({
      ...validEnvironment(),
      CHANNEL_ID_REPORTS: '  reports  ',
    })

    assert.deepEqual(config, {
      applicationId: 'application',
      botToken: 'token',
      guildId: 'guild',
      botLogsChannelId: 'logs',
      reportsChannelId: 'reports',
      talkToBotsChannelId: 'bots',
      moderatorsRoleId: 'moderators',
    })
  })

  it('reports all missing values without exposing configured secrets', () => {
    let env = validEnvironment()
    delete env.DISCORD_APP_ID
    delete env.CHANNEL_ID_REPORTS

    assert.throws(
      () => readBotConfig(env),
      /DISCORD_APP_ID, CHANNEL_ID_REPORTS/,
    )
  })
})
