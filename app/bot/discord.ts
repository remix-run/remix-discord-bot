import {
  ChannelType,
  Client,
  Events,
  GatewayIntentBits,
  Partials,
  ThreadAutoArchiveDuration,
  type MessageReaction,
  type PartialMessageReaction,
  type PartialUser,
  type User,
} from 'discord.js'

import type { RuntimeStatus } from '../runtime.ts'
import { deployGuildCommands, registerCommandHandler } from './commands.ts'
import type { BotConfig } from './config.ts'
import { executeReactionPlan, planReaction } from './reactions.ts'
import type { MessagePayload, ReactionGateway } from './types.ts'

export const BOT_INTENTS = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.GuildMessageReactions,
] as const

export const BOT_PARTIALS = [Partials.Channel, Partials.Message, Partials.Reaction, Partials.User]

export function createDiscordClient(): Client {
  return new Client({ intents: BOT_INTENTS, partials: BOT_PARTIALS })
}

export type RunningBot = {
  stop(): Promise<void>
}

export async function startDiscordBot(
  config: BotConfig,
  status: RuntimeStatus,
): Promise<RunningBot> {
  let client = createDiscordClient()

  registerCommandHandler(client, {
    startedAt: status.startedAt,
    version: status.version,
    commitSha: status.commitSha,
  })
  registerReactionHandler(client, config)
  registerParentDeletionHandler(client)

  client.once(Events.ClientReady, (readyClient) => {
    status.discordReady(readyClient.user.tag)
    console.log(`Discord connected as ${readyClient.user.tag}`)
  })
  client.on(Events.Error, (error) => {
    status.discordError()
    console.error('Discord client error', error)
  })

  try {
    await deployGuildCommands(config)
    await client.login(config.botToken)
  } catch (error) {
    status.discordError()
    client.destroy()
    throw error
  }

  return {
    async stop() {
      client.destroy()
      status.discordStopped()
    },
  }
}

export function registerReactionHandler(client: Client, config: BotConfig): void {
  client.on(Events.MessageReactionAdd, async (incomingReaction, incomingUser) => {
    try {
      let reaction = await hydrateReaction(incomingReaction)
      let actor = await hydrateUser(incomingUser)
      let message = reaction.message.partial ? await reaction.message.fetch() : reaction.message
      let guild = message.guild

      if (!guild || guild.id !== config.guildId || actor.bot || !reaction.emoji.name) return

      let author = message.author
      let event = {
        emojiName: reaction.emoji.name,
        guildId: guild.id,
        sourceChannelId: message.channel.id,
        sourceIsGuildText: message.channel.type === ChannelType.GuildText,
        messageId: message.id,
        messageUrl: message.url,
        messageAuthor: {
          id: author.id,
          username: author.username,
          mention: author.toString(),
          avatarUrl: author.displayAvatarURL(),
        },
        actor: {
          id: actor.id,
          username: actor.username,
          mention: actor.toString(),
          avatarUrl: actor.displayAvatarURL(),
        },
      }

      let plan = planReaction(event, config)
      if (!plan) return

      await executeReactionPlan(plan, new DiscordReactionGateway(reaction, config))
    } catch (error) {
      console.error('Unable to handle message reaction', error)
    }
  })
}

async function hydrateReaction(
  reaction: MessageReaction | PartialMessageReaction,
): Promise<MessageReaction> {
  return reaction.partial ? reaction.fetch() : reaction
}

async function hydrateUser(user: User | PartialUser): Promise<User> {
  return user.partial ? user.fetch() : user
}

class DiscordReactionGateway implements ReactionGateway {
  constructor(
    private readonly reaction: MessageReaction,
    private readonly config: BotConfig,
  ) {}

  async removeReaction(): Promise<void> {
    await this.reaction.remove()
  }

  async reply(payload: MessagePayload): Promise<void> {
    await this.reaction.message.reply(payload)
  }

  async send(channelId: string, payload: MessagePayload): Promise<void> {
    let channel = await this.requireSendableChannel(channelId)
    await channel.send(payload)
  }

  async createSourceThread(name: string, messages: MessagePayload[]): Promise<void> {
    let channel = this.reaction.message.channel
    if (channel.type !== ChannelType.GuildText) return

    let thread = await channel.threads.create({
      name,
      startMessage: this.reaction.message.id,
    })
    await sendAll(thread, messages)
  }

  async createReportThread(
    channelId: string,
    name: string,
    messages: MessagePayload[],
  ): Promise<void> {
    let channel = await this.reaction.message.guild?.channels.fetch(channelId)
    if (!channel || channel.type !== ChannelType.GuildText) {
      throw new Error(`Reports channel ${channelId} is not a guild text channel`)
    }

    let thread = await channel.threads.create({
      name,
      autoArchiveDuration: ThreadAutoArchiveDuration.ThreeDays,
      type: ChannelType.PublicThread,
    })
    await sendAll(thread, messages)
  }

  private async requireSendableChannel(channelId: string) {
    let channel = await this.reaction.message.guild?.channels.fetch(channelId)
    if (!channel?.isSendable()) {
      throw new Error(`Channel ${channelId} is not sendable`)
    }
    return channel
  }
}

async function sendAll(
  channel: { send(payload: MessagePayload): Promise<unknown> },
  messages: MessagePayload[],
): Promise<void> {
  for (let message of messages) await channel.send(message)
}

type ReferencedMessage = {
  author: { id: string }
  reference?: { messageId?: string | null } | null
}

export function findBotRepliesToDeletedMessage<MessageType extends ReferencedMessage>(
  messages: Iterable<MessageType>,
  deletedMessageId: string,
  botUserId: string,
): MessageType[] {
  return [...messages].filter(
    (message) =>
      message.author.id === botUserId && message.reference?.messageId === deletedMessageId,
  )
}

export function registerParentDeletionHandler(client: Client): void {
  client.on(Events.MessageDelete, async (message) => {
    try {
      let botUserId = client.user?.id
      if (!botUserId) return

      let replies = findBotRepliesToDeletedMessage(
        message.channel.messages.cache.values(),
        message.id,
        botUserId,
      )
      await Promise.all(replies.map((reply) => reply.delete()))
    } catch (error) {
      console.error('Unable to clean up replies to a deleted message', error)
    }
  })
}
