const path = require("path");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const { DISCORD_BOT_TOKEN, REMIX_GUILD_ID, DISCORD_APP_ID } = process.env;

if (!DISCORD_BOT_TOKEN) {
  throw new Error("DISCORD_BOT_TOKEN is required");
}
if (!REMIX_GUILD_ID) {
  throw new Error("REMIX_GUILD_ID is required");
}
if (!DISCORD_APP_ID) {
  throw new Error("DISCORD_APP_ID is required");
}

const commands = [
  new SlashCommandBuilder()
    .setName("info")
    .setDescription("Replies with remix bot info."),
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Replies with remix bot help."),
].map((command) => command.toJSON());

const rest = new REST({ version: "9" }).setToken(DISCORD_BOT_TOKEN);

rest
  .put(Routes.applicationGuildCommands(DISCORD_APP_ID, REMIX_GUILD_ID), {
    body: commands,
  })
  .then(() => console.log("Successfully registered application commands."))
  .catch(console.error);
