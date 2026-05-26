import type { Router } from "vue-router"
import { ElMessage } from "element-plus"
import type { WorkflowRouterJumpOptions } from "./types"

const workflowFormPathMap: Record<string, string> = {
  "/workflow/leave/leave-edit/index": "/workflow/leaveEdit/index"
}

function normalizeWorkflowFormPath(path: string) {
  const normalizedPath = path.trim().startsWith("/") ? path.trim() : "/" + path.trim()
  return workflowFormPathMap[normalizedPath] || normalizedPath
}

function getMissingWorkflowJumpFields(options: WorkflowRouterJumpOptions) {
  const missingFields: string[] = []
  if (!options.businessId) missingFields.push("业务ID")
  if (!options.taskId) missingFields.push("任务ID")
  if (!options.formPath) missingFields.push("表单路径")
  return missingFields
}

export function routerJumpWorkflowForm(router: Router, options: WorkflowRouterJumpOptions) {
  const missingFields = getMissingWorkflowJumpFields(options)
  if (missingFields.length > 0) {
    ElMessage.warning("当前记录缺少" + missingFields.join("、") + "，无法打开业务表单")
    return false
  }

  return router.push({
    path: normalizeWorkflowFormPath(options.formPath),
    query: {
      id: options.businessId,
      type: options.type,
      taskId: options.taskId
    }
  })
}
