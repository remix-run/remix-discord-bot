import type {
  MessagePayload,
  ReactionAction,
  ReactionEvent,
  ReactionGateway,
  ReactionPlan,
} from './types.ts'

export const colors = {
  info: 0x2931df,
  help: 0x474545,
  report: 0xfe3e31,
} as const

export const reactionDescriptions = {
  bothelp: 'Lists available bot reactions.',
  botreport: 'Reports a message to the server moderators.',
  botreportresume: 'Explains that the channel is for employers posting open roles.',
  botremixide: 'Explains that this server is for Remix, not Remix IDE.',
  botremixmusic: 'Explains that this server is for Remix, not musical remixes.',
  botthread: 'Creates a thread for a message.',
  botthreadask: 'Creates a thread and asks the author for more details.',
  botdoublemsg: 'Asks the author not to cross-post the same message.',
} as const

export type ReactionName = keyof typeof reactionDescriptions

export type ReactionConfig = {
  botLogsChannelId: string
  reportsChannelId: string
  talkToBotsChannelId: string
  moderatorsRoleId: string
}

const reactionNames = new Set<string>(Object.keys(reactionDescriptions))

export function isReactionName(value: string): value is ReactionName {
  return reactionNames.has(value)
}

export function planReaction(
  event: ReactionEvent,
  config: ReactionConfig,
): ReactionPlan | null {
  if (!isReactionName(event.emojiName)) return null

  let actions: ReactionAction[] = [{ type: 'remove-reaction' }]

  switch (event.emojiName) {
    case 'bothelp': {
      if (event.sourceChannelId !== config.talkToBotsChannelId) {
        actions.push({
          type: 'send',
          channelId: config.talkToBotsChannelId,
          payload: {
            content: `Hi ${event.actor.mention} 👋. You requested help in <#${event.sourceChannelId}>.`,
          },
        })
      }
      actions.push({
        type: 'send',
        channelId: config.talkToBotsChannelId,
        payload: {
          embeds: [
            {
              title: '🛎 Reactions Help',
              color: colors.help,
              description: 'Add one of these reactions to a message:',
              fields: Object.entries(reactionDescriptions).map(([name, description]) => ({
                name: `:${name}:`,
                value: description,
              })),
            },
          ],
        },
      })
      break
    }

    case 'botreport': {
      actions.push({
        type: 'create-report-thread',
        channelId: config.reportsChannelId,
        name: `🚨 Report on ${event.messageAuthor.username}`,
        messages: [
          { content: `Hey <@&${config.moderatorsRoleId}>. We need your attention on this report.` },
          {
            embeds: [
              {
                title: '🚨 User Report',
                color: colors.report,
                description: 'A user has reported a message.',
                author: {
                  name: event.messageAuthor.username,
                  icon_url: event.messageAuthor.avatarUrl,
                  url: `https://discord.com/users/${event.messageAuthor.id}`,
                },
                fields: [
                  { name: 'Message', value: `[Open in Discord](${event.messageUrl})` },
                  { name: 'Message author', value: event.messageAuthor.mention, inline: true },
                  { name: 'Reporter', value: event.actor.mention, inline: true },
                ],
              },
            ],
          },
        ],
      })
      break
    }

    case 'botreportresume': {
      actions.push(
        reply(
          'Hello 👋 This channel is for employers to post open job opportunities for Remix developers, not for job seekers to post their resume. Thanks!',
        ),
      )
      break
    }

    case 'botremixide': {
      actions.push(
        reply(
          'Hello 👋 This Discord server is about the Remix web framework at <https://remix.run>. You may be looking for Remix IDE at <https://remix-project.org>, which is a different project. If so, please delete your message. Otherwise, can you clarify? Thanks!',
        ),
      )
      break
    }

    case 'botremixmusic': {
      actions.push(
        reply(
          'Hello 👋 This Discord server is about the Remix web framework at <https://remix.run>, not musical remixes. If you are in the wrong place, please delete your message. Otherwise, can you clarify? Thanks!',
        ),
      )
      break
    }

    case 'botdoublemsg': {
      actions.push(
        reply(
          'Please avoid posting the same thing in multiple channels. Choose the best channel and wait for a response there. Delete the other message to avoid fragmenting answers and causing confusion. Thanks!',
        ),
      )
      break
    }

    case 'botthread': {
      if (event.sourceIsGuildText) {
        actions.push({
          type: 'create-source-thread',
          name: `🧵 Thread for ${event.messageAuthor.username}`,
          messages: [
            {
              content: `Hi ${event.messageAuthor.mention} 👋\nLet's discuss this further here. Feel free to change the thread title to something more descriptive.`,
            },
          ],
        })
      }
      break
    }

    case 'botthreadask': {
      if (event.sourceIsGuildText) {
        actions.push({
          type: 'create-source-thread',
          name: `🧵 Thread for ${event.messageAuthor.username}`,
          messages: [
            {
              content: `Hi ${event.messageAuthor.mention} 👋\nWe appreciate your question and will do our best to help. Could you add more detail following <https://rmx.as/ask>, especially the reproduction guidance at <https://rmx.as/repro>?`,
            },
            {
              content: 'Feel free to change the thread title to something more descriptive.',
            },
          ],
        })
      }
      break
    }
  }

  actions.push({
    type: 'send',
    channelId: config.botLogsChannelId,
    payload: {
      embeds: [
        {
          title: 'ℹ️ Bot reaction used',
          color: colors.info,
          author: {
            name: event.actor.username,
            icon_url: event.actor.avatarUrl,
            url: `https://discord.com/users/${event.actor.id}`,
          },
          description: `${event.actor.mention} added :${event.emojiName}: to ${event.messageAuthor.mention}'s message in <#${event.sourceChannelId}>.`,
          fields: [{ name: 'Message', value: `[Open in Discord](${event.messageUrl})` }],
        },
      ],
    },
  })

  return { actions }
}

function reply(content: string): ReactionAction {
  return { type: 'reply', payload: { content } }
}

export async function executeReactionPlan(
  plan: ReactionPlan,
  gateway: ReactionGateway,
): Promise<void> {
  for (let action of plan.actions) {
    await executeAction(action, gateway)
  }
}

async function executeAction(action: ReactionAction, gateway: ReactionGateway): Promise<void> {
  switch (action.type) {
    case 'remove-reaction':
      return gateway.removeReaction()
    case 'reply':
      return gateway.reply(action.payload)
    case 'send':
      return gateway.send(action.channelId, action.payload)
    case 'create-source-thread':
      return gateway.createSourceThread(action.name, action.messages)
    case 'create-report-thread':
      return gateway.createReportThread(action.channelId, action.name, action.messages)
  }
}

export function payloadText(payload: MessagePayload): string {
  return payload.content ?? payload.embeds?.map((embed) => embed.title).join(', ') ?? ''
}
