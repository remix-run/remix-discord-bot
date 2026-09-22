import {
  Events,
  REST,
  Routes,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type Client,
  type InteractionReplyOptions,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js'

import type { DiscordCredentials } from './config.ts'
import { colors, reactionDescriptions } from './reactions.ts'

export const commandDefinitions: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [
  new SlashCommandBuilder().setName('help').setDescription('Show Remy bot help.'),
  new SlashCommandBuilder().setName('info').setDescription('Show Remy runtime information.'),
].map((command) => command.toJSON())

export async function deployGuildCommands(config: DiscordCredentials): Promise<void> {
  let rest = new REST({ version: '10' }).setToken(config.botToken)
  await rest.put(Routes.applicationGuildCommands(config.applicationId, config.guildId), {
    body: commandDefinitions,
  })
}

export type CommandContext = {
  startedAt: Date
  version: string
  commitSha?: string
}

export function createCommandReply(
  commandName: string,
  context: CommandContext,
): InteractionReplyOptions | null {
  switch (commandName) {
    case 'help':
      return {
        embeds: [
          {
            title: '💁 Remy Help',
            color: colors.help,
            description: 'Remy helps the Remix community through slash commands and message reactions.',
            fields: [
              { name: '/help', value: 'Show this help message.' },
              { name: '/info', value: 'Show runtime and deployment information.' },
              {
                name: 'Message reactions',
                value: Object.entries(reactionDescriptions)
                  .map(([name, description]) => `:${name}: — ${description}`)
                  .join('\n'),
              },
            ],
          },
        ],
      }

    case 'info': {
      let startedTimestamp = Math.floor(context.startedAt.getTime() / 1_000)
      return {
        embeds: [
          {
            title: 'ℹ️ Remy Info',
            color: colors.info,
            fields: [
              { name: 'Version', value: context.version, inline: true },
              { name: 'Started', value: `<t:${startedTimestamp}:R>`, inline: true },
              { name: 'Commit', value: context.commitSha ?? 'Unknown' },
            ],
          },
        ],
      }
    }

    default:
      return null
  }
}

export function registerCommandHandler(client: Client, context: CommandContext): void {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return

    try {
      let reply = createCommandReply(interaction.commandName, context)
      if (!reply) {
        await replyToUnknownCommand(interaction)
        return
      }

      await interaction.reply(reply)
    } catch (error) {
      console.error(`Unable to handle /${interaction.commandName}`, error)
    }
  })
}

async function replyToUnknownCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.reply({ content: 'Unknown command.', ephemeral: true })
}
