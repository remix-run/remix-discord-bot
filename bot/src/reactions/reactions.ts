import type * as TDiscord from "discord.js";
import {
  colors,
  getMemberLink,
  getMessageLink,
  getReportsChannel,
  getTalkToBotsChannel,
} from "../utils";

type ReactionFn = {
  (message: TDiscord.MessageReaction): Promise<unknown>;
  description?: string;
};

const reactions: Record<string, ReactionFn> = {
  bothelp: help,
  botreport: report,
  botremixide: remixide,
  botremixmusic: remixmusic,
  botreportresume: reportresume,
} as const;

async function help(messageReaction: TDiscord.MessageReaction) {
  void messageReaction.remove();
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
  const guildEmojis = await guild.emojis.fetch();
  const reactionFields: Array<TDiscord.EmbedFieldData> = [];
  for (const [reactionName, { description }] of Object.entries(reactions)) {
    const emoji = guildEmojis.find((emoji) => emoji.name === reactionName);
    reactionFields.push({
      name: emoji ? `${emoji} ${reactionName}` : reactionName,
      value: description || "No description provided",
    });
  }

  await botsChannel.send({
    embeds: [
      {
        title: "🛎 Reactions Help",
        color: colors.base06,
        description: `Here are the available bot reactions:`,
        fields: reactionFields,
      },
    ],
  });
}
help.description = "Lists available bot reactions";

async function report(messageReaction: TDiscord.MessageReaction) {
  void messageReaction.remove();
  const guild = messageReaction.message.guild;
  if (!guild) {
    console.error("could not find message reaction guild");
    return;
  }
  const reporter = messageReaction.users.cache.first();
  if (!reporter) {
    console.error("could not find message reaction reporter");
    return;
  }
  const message = messageReaction.message;

  const offender = messageReaction.message.author;
  if (!offender) {
    console.error("could not find message reaction offender");
    return;
  }

  const reportsChannel = getReportsChannel(guild);
  if (!reportsChannel) {
    console.error("could not find message reaction reportsChannel");
    return;
  }

  const moderatorsRole =
    (await guild.roles.fetch(process.env.ROLE_ID_MODERATORS)) ?? "Moderators";

  const reportThread = await reportsChannel.threads.create({
    name: `🚨 Report on ${offender.username}`,
    autoArchiveDuration: "MAX",
    invitable: true,
    type: "GUILD_PUBLIC_THREAD",
  });

  await reportThread.send(
    `Hey ${moderatorsRole}. We need your attention on this report.`
  );
  await reportThread.send({
    embeds: [
      {
        title: "🚨 User Report",
        color: colors.base08,
        description: `A user has reported a message.`,
        author: {
          name: offender.username ?? "Unknown",
          iconURL: offender.avatarURL() ?? offender.defaultAvatarURL,
          url: getMemberLink(offender),
        },
        fields: [
          {
            name: "Message snippet",
            value: message.content?.slice(0, 100) || "Unknown",
          },
          {
            name: "Message Link",
            value: getMessageLink(message),
          },
          {
            name: "Message Author ID",
            value: offender.toString(),
            inline: true,
          },
          {
            name: "Reporter",
            value: reporter.toString(),
            inline: true,
          },
        ],
      },
    ],
  });
}
report.description = "Reports a message to the server moderators to look at.";

async function remixide(messageReaction: TDiscord.MessageReaction) {
  void messageReaction.remove();
  messageReaction.message.reply(
    `
Hello 👋 I think you may be in the wrong place. This discord server is all about the Remix Web Framework which you can learn about at <https://remix.run>. You may have mixed this up with the Remix IDE (<https://remix-project.org/>) which is a completely different project. If that's the case, please delete your message. If not, can you please clarify? Thanks!
    `.trim()
  );
}
remixide.description =
  "Replies to the message explaining that this is not the Remix IDE discord server.";

async function remixmusic(messageReaction: TDiscord.MessageReaction) {
  void messageReaction.remove();
  messageReaction.message.reply(
    `
Hello 👋 I think you may be in the wrong place. This discord server is all about the Remix Web Framework which you can learn about at <https://remix.run>. You may have mixed this up with the idea of a "Musical Remix" which is cool, but not what this place is for. If that's the case, please delete your message. If not, can you please clarify? Thanks!
    `.trim()
  );
}
remixmusic.description = `Replies to the message explaining that this is not a "Remix Music" discord server.`;

async function reportresume(messageReaction: TDiscord.MessageReaction) {
  void messageReaction.remove();
  messageReaction.message.reply(
    `
Hello 👋 This channel is for employers to post open job opportunities for Remix developers, not for job seekers to post their resume. Thanks!
    `.trim()
  );
}
reportresume.description = `Replies to the message explaining that this channel is not for posting your resume, but for employers post open Remix opportunities.`;

export default reactions;
