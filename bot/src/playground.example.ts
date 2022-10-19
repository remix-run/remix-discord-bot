// copy/paste this into a sibling file called `playground.ts`
// which is gitignored so you can make changes without committing them
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import path from "path";
import * as Discord from "discord.js";
import dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "../../.env") });

const { DISCORD_BOT_TOKEN, REMIX_GUILD_ID } = process.env;

if (!DISCORD_BOT_TOKEN) {
  throw new Error("DISCORD_BOT_TOKEN is required");
}
if (!REMIX_GUILD_ID) {
  throw new Error("REMIX_GUILD_ID is required");
}

const client = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMembers,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.GuildMessageReactions,
  ],
});

client.on("ready", async () => {
  console.log("ready to go");
  const guild = client.guilds.cache.get(REMIX_GUILD_ID);
  if (!guild) throw new Error("Could not find Remix guild");
});

console.log("logging in");
void client.login(DISCORD_BOT_TOKEN);
