import type { Router } from "vue-router"
import { ElMessage } from "element-plus"
import type { WorkflowRouterJumpOptions } from "./types"

function normalizeWorkflowFormPath(path: string) {
  return path.startsWith("/") ? path : "/" + path
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
