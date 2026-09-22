import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'
import { GatewayIntentBits } from 'discord.js'

import { BOT_INTENTS, findBotRepliesToDeletedMessage } from './discord.ts'

describe('Discord gateway configuration', () => {
  it('requests only the standard intents Remy needs', () => {
    assert.deepEqual([...BOT_INTENTS], [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
    ])

    for (let privileged of [
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildPresences,
      GatewayIntentBits.MessageContent,
    ]) {
      assert.equal(BOT_INTENTS.includes(privileged as (typeof BOT_INTENTS)[number]), false)
    }
  })
})

describe('parent message deletion', () => {
  it('selects only Remy replies that reference the deleted message', () => {
    let messages = [
      { id: 'delete-me', author: { id: 'remy' }, reference: { messageId: 'parent' } },
      { id: 'other-parent', author: { id: 'remy' }, reference: { messageId: 'other' } },
      { id: 'other-author', author: { id: 'person' }, reference: { messageId: 'parent' } },
      { id: 'no-reference', author: { id: 'remy' } },
    ]

    assert.deepEqual(
      findBotRepliesToDeletedMessage(messages, 'parent', 'remy').map((message) => message.id),
      ['delete-me'],
    )
  })
})
