import type * as Discord from "discord.js";
import { cleanupGuildOnInterval, getSelfDestructTime } from "./utils";

async function cleanup(guild: Discord.Guild) {
  const channels = Array.from(guild.channels.cache.values()).filter((ch) =>
    ch.isTextBased()
  ) as Array<Discord.TextBasedChannel>;
  if (!guild.client.user) return;

  const botId = guild.client.user.id;
  const promises = [];

  for (const channel of channels) {
    for (const message of [...channel.messages.cache.values()]) {
      if (message.author.id === botId) {
        const timeToSelfDestruct = getSelfDestructTime(message.content);
        if (
          typeof timeToSelfDestruct === "number" &&
          message.createdAt.getTime() + timeToSelfDestruct < Date.now()
        ) {
          promises.push(message.delete());
        }
      }
    }
  }

  return Promise.all(promises);
}

async function setup(client: Discord.Client) {
  // prime the message cache for all channels
  // this is important for situations when the bot gets restarted after
  // it had just sent a self-destruct chat
  await Promise.all(
    Array.from(client.guilds.cache.values()).map(async (guild) => {
      const channels = Array.from(guild.channels.cache.values()).filter((ch) =>
        ch.isTextBased()
      ) as Array<Discord.TextBasedChannel>;
      return Promise.all(
        Array.from(channels.values()).map((channel) => {
          return channel.messages.fetch({ limit: 30 });
        })
      );
    })
  );

  cleanupGuildOnInterval(client, (guild) => cleanup(guild), 5000);
}

export { setup };
