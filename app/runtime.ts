export type DiscordState = 'starting' | 'ready' | 'stopped' | 'error'

export type RuntimeSnapshot = {
  name: 'Remy'
  version: string
  startedAt: string
  discord: {
    state: DiscordState
    username?: string
  }
  commitSha?: string
}

export class RuntimeStatus {
  readonly startedAt: Date
  readonly version: string
  readonly commitSha?: string
  #discord: RuntimeSnapshot['discord'] = { state: 'starting' }

  constructor(options: { startedAt?: Date; version: string; commitSha?: string }) {
    this.startedAt = options.startedAt ?? new Date()
    this.version = options.version
    this.commitSha = options.commitSha
  }

  discordReady(username: string): void {
    this.#discord = { state: 'ready', username }
  }

  discordError(): void {
    this.#discord = { state: 'error' }
  }

  discordStopped(): void {
    this.#discord = { state: 'stopped' }
  }

  snapshot(): RuntimeSnapshot {
    return {
      name: 'Remy',
      version: this.version,
      startedAt: this.startedAt.toISOString(),
      discord: { ...this.#discord },
      ...(this.commitSha ? { commitSha: this.commitSha } : {}),
    }
  }
}
