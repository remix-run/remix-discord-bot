# Remy

Remy handles focused moderation and support workflows for the Remix Discord server. It runs a Discord.js gateway client beside a small Remix 3 HTTP server.

## Features

| Surface | Behavior |
|---|---|
| `/help`, `/info` | Help and deployment information |
| `:botreport:` | Opens a moderator report thread with a message link |
| `:botthread:`, `:botthreadask:` | Starts a discussion thread |
| `:botremixide:`, `:botremixmusic:` | Redirects off-topic posts |
| `:botreportresume:`, `:botdoublemsg:` | Posts focused moderation guidance |
| `:bothelp:` | Lists reaction workflows |
| `GET /`, `GET /healthcheck` | Runtime status and process health |

Remy requests only the standard `Guilds`, `GuildMessages`, and `GuildMessageReactions` intents. It does not read message content or request member/presence data.

## Requirements

- Node.js 24.3+
- pnpm 10+
- A Discord bot and test server

Copy `.env.example` to `.env` and provide the application, guild, channel, role, and bot credentials.

## Commands

```sh
pnpm install
pnpm dev                 # HTTP server and Discord bot with file watching
pnpm check               # TypeScript and focused tests
pnpm test:coverage
pnpm deploy:commands     # Register guild slash commands immediately
pnpm deploy:emojis       # Replace the eight bot reaction emojis
```

Slash commands are also synchronized whenever Remy starts. Emoji deployment remains explicit because it deletes and recreates matching guild emojis.

Use a separate Discord application and guild for local/manual testing. Automated tests never connect to Discord.

## Structure

| Path | Responsibility |
|---|---|
| `app/actions` | Remix HTTP controllers |
| `app/bot/reactions.ts` | Pure reaction plans and execution |
| `app/bot/discord.ts` | Discord.js event and API adapter |
| `app/bot/commands.ts` | Slash-command schema and replies |
| `app/application.ts` | HTTP/bot lifecycle |
| `scripts` | Explicit Discord setup commands |

Production runs from the pinned Node/pnpm Docker image and deploys to Fly after `pnpm check` passes on `main`.
