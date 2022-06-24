import type * as TDiscord from "discord.js";
import { colors, getTalkToBotsChannel } from "../utils";

type ReactionFn = {
  (message: TDiscord.MessageReaction): Promise<unknown>;
  description?: string;
};

const reactions: Record<string, ReactionFn | undefined> = {
  bothelp: help,
} as const;

async function help(messageReaction: TDiscord.MessageReaction) {
  const guild = messageReaction.message.guild;
  if (!guild) return;
  const helpRequester = messageReaction.users.cache.first();
  if (!helpRequester) return;

  const botsChannel = getTalkToBotsChannel(guild);
  if (!botsChannel) return;

  if (botsChannel.id !== messageReaction.message.channel.id) {
    botsChannel.send(
      `Hi ${helpRequester} 👋. You requested help in ${messageReaction.message.channel}. I'm here to help you.`
    );
  }

  await botsChannel.send({
    embeds: [
      {
        title: "🛎 Reactions Help",
        color: colors.base06,
        description: `Here are the available bot reactions:`,
        fields: [{ name: "bothelp", value: `Lists available bot reactions` }],
      },
    ],
  });
  await messageReaction.remove();
}

export default reactions;
