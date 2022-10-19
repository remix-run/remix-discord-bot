import * as Discord from "discord.js";

export function getBotLogChannel(guild: Discord.Guild) {
  const channel = guild.channels.cache.get(process.env.CHANNEL_ID_BOT_LOGS);
  if (channel?.type !== Discord.ChannelType.GuildText) return null;
  return channel;
}

export function getTalkToBotsChannel(guild: Discord.Guild) {
  const channel = guild.channels.cache.get(process.env.CHANNEL_ID_TALK_TO_BOTS);
  if (channel?.type !== Discord.ChannelType.GuildText) return null;
  return channel;
}

export function getReportsChannel(guild: Discord.Guild) {
  const channel = guild.channels.cache.get(process.env.CHANNEL_ID_REPORTS);
  if (channel?.type !== Discord.ChannelType.GuildText) return null;
  return channel;
}
