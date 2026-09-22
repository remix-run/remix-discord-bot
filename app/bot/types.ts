export type Embed = {
  title: string
  description?: string
  color?: number
  author?: {
    name: string
    icon_url?: string
    url?: string
  }
  fields?: Array<{
    name: string
    value: string
    inline?: boolean
  }>
}

export type MessagePayload = {
  content?: string
  embeds?: Embed[]
}

export type ReactionEvent = {
  emojiName: string
  guildId: string
  sourceChannelId: string
  sourceIsGuildText: boolean
  messageId: string
  messageUrl: string
  messageAuthor: {
    id: string
    username: string
    mention: string
    avatarUrl: string
  }
  actor: {
    id: string
    username: string
    mention: string
    avatarUrl: string
  }
}

export type ReactionAction =
  | { type: 'remove-reaction' }
  | { type: 'reply'; payload: MessagePayload }
  | { type: 'send'; channelId: string; payload: MessagePayload }
  | { type: 'create-source-thread'; name: string; messages: MessagePayload[] }
  | { type: 'create-report-thread'; channelId: string; name: string; messages: MessagePayload[] }

export type ReactionPlan = {
  actions: ReactionAction[]
}

export type ReactionGateway = {
  removeReaction(): Promise<void>
  reply(payload: MessagePayload): Promise<void>
  send(channelId: string, payload: MessagePayload): Promise<void>
  createSourceThread(name: string, messages: MessagePayload[]): Promise<void>
  createReportThread(
    channelId: string,
    name: string,
    messages: MessagePayload[],
  ): Promise<void>
}
