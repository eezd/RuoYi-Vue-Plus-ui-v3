export interface FlowInstanceQuery extends PageQuery {
  category?: string
  nodeName?: string
  flowCode?: string
  flowName?: string
  createByIds?: Array<string | number>
  businessId?: string
}

export interface FlowInstanceVO extends BaseEntity {
  id: string | number
  definitionId: string
  flowName: string
  flowCode: string
  categoryName: string
  version: string
  businessId: string
  activityStatus: number
  isSuspended: boolean
  createBy: string
  createByName: string
  flowStatus: string
  flowStatusName: string
  nodeName: string
  businessCode: string
  businessTitle: string
  formCustom: string
  formPath: string
  updateTime?: string
}

export interface FlowHistoryTaskVO extends BaseEntity {
  id: string | number
  definitionId?: string | number
  flowName?: string
  instanceId?: string | number
  taskId?: string | number
  cooperateType?: number
  cooperateTypeName?: string
  businessId?: string
  nodeCode?: string
  nodeName?: string
  nodeType?: number
  targetNodeCode?: string
  targetNodeName?: string
  approver?: string
  approverName?: string
  collaborator?: string
  permissionList?: string[]
  skipType?: string
  flowStatus?: string
  flowTaskStatus?: string
  flowStatusName?: string
  message?: string
  ext?: string
  createBy?: string
  createByName?: string
  category?: string
  categoryName?: string
  formCustom?: string
  formPath?: string
  flowCode?: string
  version?: string
  runDuration?: string
  businessCode?: string
  businessTitle?: string
}

export interface FlowHistoryTaskListResult {
  list: FlowHistoryTaskVO[]
  instanceId: string | number
}

export interface CancelProcessApplyForm {
  businessId: string | number
  message: string
}

export interface InvalidProcessForm {
  id: string | number
  comment: string
}

export interface FlowVariableForm {
  instanceId: string | number
  key: string
  value: string
}
