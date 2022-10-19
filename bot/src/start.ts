import * as Discord from "discord.js";
import * as commands from "./commands";
import * as reactions from "./reactions";
import * as admin from "./admin";

export async function start() {
  const client = new Discord.Client({
    intents: [
      Discord.GatewayIntentBits.Guilds,
      Discord.GatewayIntentBits.GuildMembers,
      Discord.GatewayIntentBits.GuildMessages,
      Discord.GatewayIntentBits.GuildMessageReactions,
    ],
  });

  // setup all parts of the bot here
  commands.setup(client);
  reactions.setup(client);
  admin.setup(client);

  console.log("logging in...");
  await client.login(process.env.DISCORD_BOT_TOKEN);
  console.log("client logged in");
  return async function cleanup() {
    console.log("logging out");
    client.destroy();
  };
}
