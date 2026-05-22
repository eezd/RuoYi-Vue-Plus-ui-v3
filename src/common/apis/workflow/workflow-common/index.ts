import type { Router } from "vue-router"
import type { WorkflowRouterJumpOptions } from "./types"

function normalizeWorkflowFormPath(path: string) {
  return path.startsWith("/") ? path : `/${path}`
}

export function routerJumpWorkflowForm(router: Router, options: WorkflowRouterJumpOptions) {
  return router.push({
    path: normalizeWorkflowFormPath(options.formPath),
    query: {
      id: options.businessId,
      type: options.type,
      taskId: options.taskId
    }
  })
}
