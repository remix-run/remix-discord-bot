import { startApplication } from './app/application.ts'
import { readBotConfig } from './app/bot/config.ts'
import { APP_VERSION } from './app/version.ts'

let port = Number.parseInt(process.env.PORT ?? '8080', 10)
if (!Number.isSafeInteger(port) || port < 0 || port > 65_535) {
  throw new Error(`Invalid PORT: ${process.env.PORT}`)
}

let application = await startApplication({
  botConfig: readBotConfig(process.env),
  port,
  version: APP_VERSION,
  commitSha: process.env.COMMIT_SHA,
})

let address = application.server.address()
let boundPort = typeof address === 'object' && address ? address.port : port
console.log(`HTTP server listening on port ${boundPort}`)

let shuttingDown = false
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return
  shuttingDown = true
  console.log(`Received ${signal}; shutting down`)
  await application.stop()
}

process.once('SIGINT', () => void shutdown('SIGINT'))
process.once('SIGTERM', () => void shutdown('SIGTERM'))
