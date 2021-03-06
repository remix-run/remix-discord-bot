const path = require("path");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const invariant = require("tiny-invariant");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const { DISCORD_BOT_TOKEN, REMIX_GUILD_ID, DISCORD_APP_ID } = process.env;

invariant(DISCORD_BOT_TOKEN, "DISCORD_BOT_TOKEN is required");
invariant(REMIX_GUILD_ID, "REMIX_GUILD_ID is required");
invariant(DISCORD_APP_ID, "DISCORD_APP_ID is required");

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
