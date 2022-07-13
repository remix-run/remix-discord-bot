const path = require("path");
const fs = require("fs").promises;
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const invariant = require("tiny-invariant");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const { DISCORD_BOT_TOKEN, REMIX_GUILD_ID } = process.env;

invariant(DISCORD_BOT_TOKEN, "DISCORD_BOT_TOKEN is required");
invariant(REMIX_GUILD_ID, "REMIX_GUILD_ID is required");

const rest = new REST({ version: "9" }).setToken(DISCORD_BOT_TOKEN);

const here = (...p) => path.join(__dirname, ...p);

async function go() {
  const emojis = [
    {
      name: "bothelp",
      image: `data:image/png;base64,${await fs.readFile(
        here("./bothelp.png"),
        "base64"
      )}`,
    },
    {
      name: "botreport",
      image: `data:image/png;base64,${await fs.readFile(
        here("./botreport.png"),
        "base64"
      )}`,
    },
    {
      name: "botremixide",
      image: `data:image/png;base64,${await fs.readFile(
        here("./botremixide.png"),
        "base64"
      )}`,
    },
  ];
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
