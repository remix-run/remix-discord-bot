import * as TDiscord from "discord.js";
import { HTTPError } from "discord.js";
import { getBotLogChannel, getTalkToBotsChannel } from "./channels";
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
  messageFn: () => string | TDiscord.APIEmbed | undefined
) {
  const botsChannel = getBotLogChannel(guild);
  if (!botsChannel) return;

  let message: TDiscord.BaseMessageOptions;
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
      let messageSummary: string | null | undefined = message.content;
      if (!messageSummary && message.embeds?.[0] instanceof TDiscord.Embed) {
        messageSummary =
          message.embeds[0].title ?? message.embeds[0].description;
      }
      console.error(
        `Unable to log message: "${messageSummary}"`,
        getErrorStack(error),
        callerStack
      );
    });
}

// read up on dynamic setIntervalAsync here: https://github.com/ealmansi/set-interval-async#dynamic-and-fixed-setintervalasync
export function cleanupGuildOnInterval(
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

export async function sendBotMessageReply(
  msg: TDiscord.Message,
  reply: string
) {
  const { guild, channel } = msg;
  if (!guild) return;

  const botsChannel = getTalkToBotsChannel(guild);
  if (!botsChannel) return;

  if (botsChannel.id === channel.id) {
    // if they sent this from the bot's channel then we'll just send the reply
    return botsChannel.send(reply);
  } else {
    // otherwise, we'll send the reply in the bots channel and let them know
    // where they can get the reply.
    const botMsg = await botsChannel.send(
      `
_Replying to ${msg.author} <${getMessageLink(msg)}>_

${reply}
      `.trim()
    );
    if (channel.isTextBased()) {
      return sendSelfDestructMessage(
        channel,
        `Hey ${msg.author}, I sent you a message here: ${getMessageLink(
          botMsg
        )}`,
        { time: 7, units: "seconds" }
      );
    }
  }
}
const timeToMs = {
  seconds: (t: number) => t * 1000,
  minutes: (t: number) => t * 1000 * 60,
  hours: (t: number) => t * 1000 * 60 * 60,
  days: (t: number) => t * 1000 * 60 * 60 * 24,
  weeks: (t: number) => t * 1000 * 60 * 60 * 24 * 7,
};

export async function sendSelfDestructMessage(
  channel: TDiscord.TextBasedChannel,
  messageContent: string,
  {
    time = 10,
    units = "seconds",
  }: { time?: number; units?: keyof typeof timeToMs } = {}
) {
  return channel.send(
    `
${messageContent}
_This message will self-destruct in about ${time} ${units}_
    `.trim()
  );
}

export function getSelfDestructTime(messageContent: string) {
  const supportedUnits = Object.keys(timeToMs).join("|");
  const regex = new RegExp(
    `self-destruct in about (?<time>\\d+) (?<units>${supportedUnits})`,
    "i"
  );
  const match = messageContent.match(regex);
  if (!match) return null;
  const { units, time } = match.groups as {
    time: string;
    units: keyof typeof timeToMs;
  };
  return timeToMs[units](Number(time));
}

export * from "./build-info";
export * as colors from "./colors";
export * from "./channels";
