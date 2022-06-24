import type * as Discord from "discord.js";

export function getBotLogChannel(guild: Discord.Guild) {
  const channel = guild.channels.cache.get(process.env.CHANNEL_ID_BOT_LOGS);
  if (channel?.type !== "GUILD_TEXT") return null;
  return channel;
}

export function getTalkToBotsChannel(guild: Discord.Guild) {
  const channel = guild.channels.cache.get(process.env.CHANNEL_ID_TALK_TO_BOTS);
  if (channel?.type !== "GUILD_TEXT") return null;
  return channel;
}
