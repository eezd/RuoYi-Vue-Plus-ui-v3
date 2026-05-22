export interface WorkflowRouterJumpOptions {
  businessId: string | number
  taskId: string | number
  type: "add" | "update" | "view" | "approval" | string
  formCustom?: string
  formPath: string
}
