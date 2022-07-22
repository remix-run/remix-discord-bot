import type * as TDiscord from "discord.js";
import * as dedupeMessages from "./dedupe";
import * as selfDestruct from "./cleanup-self-destruct-messages";

function setup(client: TDiscord.Client) {
  client.on("message", dedupeMessages.handleNewMessage);
  dedupeMessages.setup(client);
  selfDestruct.setup(client);
}

export { setup };
