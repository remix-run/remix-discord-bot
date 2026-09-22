import type { ReactionConfig } from './reactions.ts'

export type DiscordCredentials = {
  applicationId: string
  botToken: string
  guildId: string
}

export type BotConfig = DiscordCredentials & ReactionConfig

const credentialKeys = {
  applicationId: 'DISCORD_APP_ID',
  botToken: 'DISCORD_BOT_TOKEN',
  guildId: 'REMIX_GUILD_ID',
} as const

const channelKeys = {
  botLogsChannelId: 'CHANNEL_ID_BOT_LOGS',
  reportsChannelId: 'CHANNEL_ID_REPORTS',
  talkToBotsChannelId: 'CHANNEL_ID_TALK_TO_BOTS',
  moderatorsRoleId: 'ROLE_ID_MODERATORS',
} as const

export function readDiscordCredentials(env: NodeJS.ProcessEnv): DiscordCredentials {
  return readRequired(env, credentialKeys)
}

export function readBotConfig(env: NodeJS.ProcessEnv): BotConfig {
  return readRequired(env, { ...credentialKeys, ...channelKeys })
}

function readRequired<const Keys extends Record<string, string>>(
  env: NodeJS.ProcessEnv,
  keys: Keys,
): { [Key in keyof Keys]: string } {
  let result = {} as { [Key in keyof Keys]: string }
  let missing: string[] = []

  for (let [property, environmentName] of Object.entries(keys)) {
    let value = env[environmentName]
    if (!value?.trim()) {
      missing.push(environmentName)
      continue
    }
    result[property as keyof Keys] = value.trim()
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  return result
}
