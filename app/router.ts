import { createRouter } from 'remix/router'

import { createAppController } from './actions/controller.ts'
import type { RuntimeStatus } from './runtime.ts'
import { routes } from './routes.ts'

export function createAppRouter(status: RuntimeStatus) {
  let router = createRouter()
  router.map(routes, createAppController(status))
  return router
}
