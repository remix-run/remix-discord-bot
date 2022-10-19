import type * as Discord from "discord.js";
import * as dedupeMessages from "./dedupe";
import * as selfDestruct from "./cleanup-self-destruct-messages";

function setup(client: Discord.Client) {
  client.on("message", dedupeMessages.handleNewMessage);
  dedupeMessages.setup(client);
  selfDestruct.setup(client);
}

export { setup };
