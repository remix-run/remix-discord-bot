import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

import { REST, Routes } from 'discord.js'

import { readDiscordCredentials } from '../app/bot/config.ts'

let config = readDiscordCredentials(process.env)
let rest = new REST({ version: '10' }).setToken(config.botToken)
let emojiDirectory = path.resolve('scripts/bot-emoji')
let files = (await readdir(emojiDirectory)).filter((file) => file.startsWith('bot'))
let existing = (await rest.get(Routes.guildEmojis(config.guildId))) as Array<{
  id: string
  name: string | null
}>

for (let file of files) {
  let parsed = path.parse(file)
  let current = existing.find((emoji) => emoji.name === parsed.name)
  if (current) await rest.delete(Routes.guildEmoji(config.guildId, current.id))

  let image = await readFile(path.join(emojiDirectory, file), 'base64')
  await rest.post(Routes.guildEmojis(config.guildId), {
    body: {
      name: parsed.name,
      image: `data:image/${parsed.ext.slice(1)};base64,${image}`,
    },
  })
}

console.log(`Updated ${files.length} guild emojis.`)
