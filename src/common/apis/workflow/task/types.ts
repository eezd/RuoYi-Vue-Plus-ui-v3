export interface TaskQuery extends PageQuery {
  nodeName?: string
  flowCode?: string
  flowName?: string
  createByIds?: Array<string | number>
}

export interface FlowTaskVO extends BaseEntity {
  id: string | number
  instanceId: string
  flowName: string
  businessId: string
  nodeCode: string
  nodeName: string
  flowCode: string
  flowStatus: string
  flowStatusName: string
  formCustom: string
  formPath: string
  nodeType: number
  nodeRatio: string | number
  version: string
  businessCode: string
  businessTitle: string
  categoryName: string
  createByName: string
  assigneeNames: string
  approveName: string
  flowTaskStatus: string
}

export interface StartWorkflowForm {
  businessId: string | number
  flowCode: string
  variables: Record<string, any>
  bizExt: Record<string, any>
}

export interface UpdateAssigneeForm {
  userId: string | number
  taskIdList: Array<string | number>
}

export interface UrgeTaskForm {
  taskIdList: Array<string | number>
  message: string
  messageType: string
}
