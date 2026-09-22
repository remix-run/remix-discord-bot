import { deployGuildCommands } from '../app/bot/commands.ts'
import { readDiscordCredentials } from '../app/bot/config.ts'

await deployGuildCommands(readDiscordCredentials(process.env))
console.log('Registered guild commands.')
