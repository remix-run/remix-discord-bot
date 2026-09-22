import { createController } from 'remix/router'

import type { RuntimeStatus } from '../runtime.ts'
import { routes } from '../routes.ts'

export function createAppController(status: RuntimeStatus) {
  return createController(routes, {
    actions: {
      home() {
        return Response.json(status.snapshot(), {
          headers: { 'Cache-Control': 'no-store' },
        })
      },
      healthcheck() {
        return Response.json(
          { ok: true, discord: status.snapshot().discord.state },
          { headers: { 'Cache-Control': 'no-store' } },
        )
      },
    },
  })
}
