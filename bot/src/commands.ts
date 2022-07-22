import type * as Discord from "discord.js";
import {
  colors,
  getBuildTimeInfo,
  getCommitInfo,
  getStartTimeInfo,
} from "./utils";

export function setup(client: Discord.Client) {
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    switch (commandName) {
      case "info": {
        const commitInfo = getCommitInfo();
        await interaction.reply({
          embeds: [
            {
              title: "ℹ️ Bot info",
              color: colors.base0B,
              description: `Here's some info about the currently running bot:`,
              fields: [
                ...(commitInfo
                  ? [
                    { name: "Commit Author", value: commitInfo.author },
                    { name: "Commit Date", value: commitInfo.date },
                    { name: "Commit Message", value: commitInfo.message },
                    { name: "Commit Link", value: commitInfo.link },
                  ]
                  : [{ name: "Commit Info", value: "Unavailable" }]),
                { name: "Started at", value: getStartTimeInfo() },
                { name: "Built at", value: getBuildTimeInfo() },
              ],
            },
          ],
        });
        break;
      }
      case "help": {
        interaction.reply({
          embeds: [
            {
              title: "💁 Bot Help",
              color: colors.base0E,
              description: `Here's some handy things you can do with the bot:`,
              fields: [
                {
                  name: "/help",
                  value:
                    "This is the command you used to get this message printed out.",
                },
                {
                  name: "/info",
                  value:
                    "Use the `/info` command to get info about the running bot.",
                },
                {
                  name: "Bot Reaction emoji",
                  value: `We have a handful of \`:bot\`-prefixed emoji which you can use to do various things. Reply to any message with \`:bothelp:\` and I'll tell you more`,
                },
              ],
            },
          ],
        });
        break;
      }
      default: {
        console.error(`unknown command "${commandName}"`);
        break;
      }
    }
  });

  client.on("messageDelete", async (msg) => {
    const referencedMessage = msg.channel.messages.cache.find(m => m.reference?.messageId === msg.id && m.author.id === client.user?.id);

    // If there's a message reference and it's from the bot, delete the bot message
    // https://discord.js.org/#/docs/main/stable/class/Message?scrollTo=fetchReference
    if (referencedMessage != null) {
      await referencedMessage.delete();
    }
  })
}
