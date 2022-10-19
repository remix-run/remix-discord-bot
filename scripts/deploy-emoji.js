const path = require("path");
const fs = require("fs").promises;
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const { DISCORD_BOT_TOKEN, REMIX_GUILD_ID } = process.env;

if (!DISCORD_BOT_TOKEN) {
  throw new Error("DISCORD_BOT_TOKEN is required");
}
if (!REMIX_GUILD_ID) {
  throw new Error("REMIX_GUILD_ID is required");
}

const rest = new REST({ version: "9" }).setToken(DISCORD_BOT_TOKEN);

const here = (...p) => path.join(__dirname, ...p);

async function go() {
  const emojiFiles = (await fs.readdir(here("bot-emoji"))).filter((file) =>
    file.startsWith("bot")
  );
  const emojis = [];
  for (const emojiFile of emojiFiles) {
    const parsed = path.parse(emojiFile);
    const base64 = await fs.readFile(here("bot-emoji", emojiFile), "base64");
    const extension = parsed.ext.slice(1);
    emojis.push({
      name: parsed.name,
      image: `data:image/${extension};base64,${base64}`,
    });
  }
  const list = await rest.get(Routes.guildEmojis(REMIX_GUILD_ID));

  for (const emoji of emojis) {
    const existingEmoji = list.find((e) => e.name === emoji.name);
    // delete it if it already exists
    if (existingEmoji) {
      await rest.delete(Routes.guildEmoji(REMIX_GUILD_ID, existingEmoji.id));
    }
    // create the new emoji
    await rest.post(Routes.guildEmojis(REMIX_GUILD_ID), { body: emoji });
  }
  console.log("Successfully updated emoji.");
}

go();
