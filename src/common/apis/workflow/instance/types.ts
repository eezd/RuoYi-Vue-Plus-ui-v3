export interface FlowInstanceQuery extends PageQuery {
  category?: string | number
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
  tenantId: string
  createBy: string
  createByName: string
  flowStatus: string
  flowStatusName: string
  nodeName: string
  businessCode: string
  businessTitle: string
  formCustom: string
  formPath: string
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
