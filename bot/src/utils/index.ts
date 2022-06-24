import type * as TDiscord from "discord.js";
import { HTTPError } from "discord.js";
import { getBotLogChannel } from "./channels";
import { setIntervalAsync } from "set-interval-async/dynamic";

export const getMessageLink = (
  msg: TDiscord.Message | TDiscord.PartialMessage
) =>
  `https://discordapp.com/channels/${msg.guild?.id ?? "@me"}/${
    msg.channel.id
  }/${msg.id}`;

export const getMemberLink = (member: TDiscord.GuildMember | TDiscord.User) =>
  `https://discord.com/users/${member.id}`;

function getErrorStack(error: unknown) {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.stack;
  return "Unknown Error";
}

function getErrorMessage(error: unknown) {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return "Unknown Error";
}

export function botLog(
  guild: TDiscord.Guild,
  messageFn: () => string | TDiscord.MessageEmbedOptions | undefined
) {
  const botsChannel = getBotLogChannel(guild);
  if (!botsChannel) return;

  let message: TDiscord.MessageOptions;
  try {
    const result = messageFn();
    if (!result) return;

    if (typeof result === "string") {
      message = { content: result };
    } else {
      message = { embeds: [result] };
    }
  } catch (error: unknown) {
    console.error(`Unable to get message for bot log`, getErrorStack(error));
    return;
  }

  const callerStack = new Error("Caller stack:");

  // make sure sync errors don't crash the bot
  return Promise.resolve()
    .then(() => botsChannel.send(message))
    .catch((error: unknown) => {
      const messageSummary =
        message.content ??
        message.embeds?.[0]?.title ??
        message.embeds?.[0]?.description;
      console.error(
        `Unable to log message: "${messageSummary}"`,
        getErrorStack(error),
        callerStack
      );
    });
}

// read up on dynamic setIntervalAsync here: https://github.com/ealmansi/set-interval-async#dynamic-and-fixed-setintervalasync
function cleanupGuildOnInterval(
  client: TDiscord.Client,
  cb: (client: TDiscord.Guild) => Promise<unknown>,
  interval: number
) {
  setIntervalAsync(async () => {
    try {
      return await Promise.all(
        Array.from(client.guilds.cache.values()).map(cb)
      );
    } catch (error) {
      if (error instanceof HTTPError) {
        // ignore HTTPErrors. If they get to this point, there's not much
        // we can do anyway.
        return;
      }
      if (error && (error as { status?: number }).status === 500) {
        // if it has a status value that is 500 then there really is nothing
        // we can do about that so just move on...
        return;
      }
      console.error(error);
    }
  }, interval);
}

function typedBoolean<T>(
  value: T
): value is Exclude<T, false | null | undefined | "" | 0> {
  return Boolean(value);
}

async function hasReactionFromUser(
  message: TDiscord.Message,
  host: TDiscord.GuildMember,
  emoji: string
) {
  const reaction = message.reactions.cache.get(emoji);
  if (!reaction) return false;
  const usersWhoReacted = await reaction.users.fetch();
  return usersWhoReacted.some((user) => user.id === host.id);
}

export * from "./build-info";
export * as colors from "./colors";
export * from "./channels";
