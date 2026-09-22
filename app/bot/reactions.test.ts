import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import {
  executeReactionPlan,
  planReaction,
  reactionDescriptions,
  type ReactionConfig,
  type ReactionName,
} from './reactions.ts'
import type { ReactionEvent, ReactionGateway } from './types.ts'

const config: ReactionConfig = {
  botLogsChannelId: 'logs',
  reportsChannelId: 'reports',
  talkToBotsChannelId: 'bots',
  moderatorsRoleId: 'moderators',
}

function event(
  emojiName: string,
  overrides: Partial<ReactionEvent> = {},
): ReactionEvent {
  return {
    emojiName,
    guildId: 'guild',
    sourceChannelId: 'general',
    sourceIsGuildText: true,
    messageId: 'message',
    messageUrl: 'https://discord.com/channels/guild/general/message',
    messageAuthor: {
      id: 'author',
      username: 'Author',
      mention: '<@author>',
      avatarUrl: 'https://cdn.example/author.png',
    },
    actor: {
      id: 'actor',
      username: 'Actor',
      mention: '<@actor>',
      avatarUrl: 'https://cdn.example/actor.png',
    },
    ...overrides,
  }
}

function actionTypes(name: string, overrides?: Partial<ReactionEvent>): string[] {
  let plan = planReaction(event(name, overrides), config)
  assert.ok(plan)
  return plan.actions.map((action) => action.type)
}

describe('reaction plans', () => {
  it('defines exactly the supported reaction surface', () => {
    assert.deepEqual(Object.keys(reactionDescriptions), [
      'bothelp',
      'botreport',
      'botreportresume',
      'botremixide',
      'botremixmusic',
      'botthread',
      'botthreadask',
      'botdoublemsg',
    ])
    assert.equal(planReaction(event('not-remy'), config), null)
  })

  it('routes help to the bot channel and includes every reaction', () => {
    let plan = planReaction(event('bothelp'), config)
    assert.ok(plan)
    assert.deepEqual(plan.actions.map((action) => action.type), [
      'remove-reaction',
      'send',
      'send',
      'send',
    ])

    let help = plan.actions[2]
    assert.equal(help.type, 'send')
    assert.equal(help.channelId, 'bots')
    assert.equal(help.payload.embeds?.[0].fields?.length, 8)
  })

  it('does not duplicate the help introduction inside the bot channel', () => {
    assert.deepEqual(actionTypes('bothelp', { sourceChannelId: 'bots' }), [
      'remove-reaction',
      'send',
      'send',
    ])
  })

  it('creates a report without reading message content', () => {
    let plan = planReaction(event('botreport'), config)
    assert.ok(plan)
    assert.deepEqual(plan.actions.map((action) => action.type), [
      'remove-reaction',
      'create-report-thread',
      'send',
    ])

    let report = plan.actions[1]
    assert.equal(report.type, 'create-report-thread')
    assert.equal(report.channelId, 'reports')
    assert.match(report.messages[0].content ?? '', /<@&moderators>/)
    assert.match(JSON.stringify(report.messages[1]), /Open in Discord/)
    assert.doesNotMatch(JSON.stringify(report.messages), /snippet/i)
  })

  for (let [name, expected] of [
    ['botreportresume', /employers/],
    ['botremixide', /Remix IDE/],
    ['botremixmusic', /musical remixes/],
    ['botdoublemsg', /multiple channels/],
  ] as Array<[ReactionName, RegExp]>) {
    it(`${name} replies with focused guidance`, () => {
      let plan = planReaction(event(name), config)
      assert.ok(plan)
      assert.deepEqual(plan.actions.map((action) => action.type), [
        'remove-reaction',
        'reply',
        'send',
      ])
      let reply = plan.actions[1]
      assert.equal(reply.type, 'reply')
      assert.match(reply.payload.content ?? '', expected)
    })
  }

  it('creates a discussion thread', () => {
    assert.deepEqual(actionTypes('botthread'), [
      'remove-reaction',
      'create-source-thread',
      'send',
    ])
  })

  it('creates an ask thread with guidance and a naming prompt', () => {
    let plan = planReaction(event('botthreadask'), config)
    assert.ok(plan)
    let thread = plan.actions[1]
    assert.equal(thread.type, 'create-source-thread')
    assert.equal(thread.messages.length, 2)
    assert.match(thread.messages[0].content ?? '', /rmx\.as\/repro/)
  })

  it('does not attempt to create a starter-message thread outside guild text channels', () => {
    assert.deepEqual(actionTypes('botthread', { sourceIsGuildText: false }), [
      'remove-reaction',
      'send',
    ])
  })
})

describe('reaction execution', () => {
  it('executes actions in their declared order', async () => {
    let calls: string[] = []
    let gateway: ReactionGateway = {
      async removeReaction() {
        calls.push('remove')
      },
      async reply(payload) {
        calls.push(`reply:${payload.content}`)
      },
      async send(channelId) {
        calls.push(`send:${channelId}`)
      },
      async createSourceThread(name) {
        calls.push(`source:${name}`)
      },
      async createReportThread(channelId) {
        calls.push(`report:${channelId}`)
      },
    }

    await executeReactionPlan(
      {
        actions: [
          { type: 'remove-reaction' },
          { type: 'reply', payload: { content: 'hello' } },
          { type: 'send', channelId: 'logs', payload: { content: 'logged' } },
        ],
      },
      gateway,
    )

    assert.deepEqual(calls, ['remove', 'reply:hello', 'send:logs'])
  })
})
