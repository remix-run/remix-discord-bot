# Contributing

To get things running locally, run `npm run setup`.

## Environment Variables

To actually run the real bot, you're going to need a bot token and a guild token for the server that bot is a part of. The bot token is obviously not committed to this repo. If you're an external contributor, you'll need to test things using your own server and bot.

Check the `.env.example` for the values you need to set in a local `.env` file.

## Playground

Sometimes it's easier to just run the bot with specific bits of code to test things out. That's what the playground file is for. The `bot/src/playground.ts` file is gitignored so you can change that to whatever you want. To run it, run `npm run play:bot`.
