# Remy development guide

Use `.agents/skills/remix/SKILL.md` for Remix 3 work.

## Commands

```sh
pnpm check
pnpm test:coverage
pnpm dev
```

## Boundaries

- Keep Discord-independent behavior in pure, focused modules.
- Keep Discord.js objects inside `app/bot/discord.ts`.
- Never add `GuildMembers`, `GuildPresences`, or `MessageContent` without an explicit product and privacy review.
- Test route behavior through `router.fetch(Request)`.
- Tests must not connect to Discord or require credentials.
