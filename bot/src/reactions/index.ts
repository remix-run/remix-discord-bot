import type * as Discord from "discord.js";
import reactions from "./reactions";
import { botLog, colors, getMemberLink, getMessageLink } from "./utils";

async function handleNewReaction(
  messageReaction: Discord.MessageReaction | Discord.PartialMessageReaction,
  reactingUser: Discord.User | Discord.PartialUser
) {
  if (messageReaction.partial) {
    try {
      messageReaction = await messageReaction.fetch();
    } catch (error: unknown) {
      console.error(
        "Something went wrong when fetching the message reaction: ",
        error
      );
      return;
    }
  }
  if (reactingUser.partial) {
    try {
      await reactingUser.fetch();
    } catch (error: unknown) {
      console.error(
        "Something went wrong when fetching the reacting user: ",
        error
      );
      return;
    }
  }
  const guild = messageReaction.message.guild;
  if (!guild) return;
  // ignore reactions from the bot...
  if (reactingUser.id === guild.client.user?.id) return;

  const emoji = messageReaction.emoji;
  if (!emoji.name) return;

  const reactionFn = reactions[emoji.name];
  if (!reactionFn) return;

  await reactionFn(messageReaction);

  const { message } = messageReaction;

  void botLog(guild, () => {
    const reactingMember = guild.members.cache.get(reactingUser.id);
    if (!reactingMember) return;

    return {
      title: "ℹ️ Someone used a bot reaction",
      color: colors.base0D,
      author: {
        name: reactingMember?.displayName ?? "Unknown",
        iconURL:
          reactingMember.user.avatarURL() ??
          reactingMember.user.defaultAvatarURL,
        url: reactingMember
          ? getMemberLink(reactingMember)
          : "https://example.com/unknown-reacting-member",
      },
      description: `${reactingMember ?? "Unknown member"} added ${emoji} (\`${
        emoji.name
      }\`) to ${message.member ?? "Unknown member"}'s message in ${
        message.channel
      }`,
      fields: [
        { name: "Reacting Member ID", value: reactingMember.id, inline: true },
        {
          name: "Message Member ID",
          value: message.member?.id ?? "unknown",
          inline: true,
        },
        { name: "Channel", value: message.channel.toString(), inline: true },
        { name: "Message link", value: getMessageLink(message), inline: true },
      ],
    };
  });
}

export async function setup(client: Discord.Client) {
  client.on("messageReactionAdd", (messageReaction, user) => {
    void handleNewReaction(messageReaction, user);
  });

  client.on("messageDelete", async (msg) => {
    const referencedMessage = [...msg.channel.messages.cache.values()].find(
      (m) =>
        m.reference?.messageId === msg.id && m.author.id === client.user?.id
    );

    if (referencedMessage != null) {
      await referencedMessage.delete();
    }
  });
}
