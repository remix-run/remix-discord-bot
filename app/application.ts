import * as http from 'node:http'

import { createRequestListener } from 'remix/node-fetch-server'

import type { BotConfig } from './bot/config.ts'
import { startDiscordBot, type RunningBot } from './bot/discord.ts'
import { createAppRouter } from './router.ts'
import { RuntimeStatus } from './runtime.ts'

export type Application = {
  server: http.Server
  status: RuntimeStatus
  stop(): Promise<void>
}

export type StartApplicationOptions = {
  botConfig: BotConfig
  port: number
  version: string
  commitSha?: string
  startedAt?: Date
  startBot?: (config: BotConfig, status: RuntimeStatus) => Promise<RunningBot>
}

export async function startApplication(options: StartApplicationOptions): Promise<Application> {
  let status = new RuntimeStatus({
    version: options.version,
    commitSha: options.commitSha,
    startedAt: options.startedAt,
  })
  let router = createAppRouter(status)
  let server = http.createServer(
    createRequestListener(async (request) => {
      try {
        return await router.fetch(request)
      } catch (error) {
        if (!(request.signal.aborted && error === request.signal.reason)) {
          console.error('HTTP request failed', error)
        }
        return new Response('Internal Server Error', { status: 500 })
      }
    }),
  )

  await listen(server, options.port)

  let bot: RunningBot
  try {
    bot = await (options.startBot ?? startDiscordBot)(options.botConfig, status)
  } catch (error) {
    await close(server)
    throw error
  }

  let stopped = false
  return {
    server,
    status,
    async stop() {
      if (stopped) return
      stopped = true
      await Promise.all([close(server), bot.stop()])
    },
  }
}

function listen(server: http.Server, port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, '0.0.0.0', () => {
      server.off('error', reject)
      resolve()
    })
  })
}

function close(server: http.Server): Promise<void> {
  if (!server.listening) return Promise.resolve()
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
    server.closeAllConnections()
  })
}
