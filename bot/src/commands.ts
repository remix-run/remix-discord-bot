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

    if (commandName === "info") {
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
    }
  });
}
