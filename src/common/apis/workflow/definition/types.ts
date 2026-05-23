export interface FlowDefinitionQuery extends PageQuery {
  flowCode?: string
  flowName?: string
  category?: string
  isPublish?: number
}

export interface FlowDefinitionVO {
  id: string
  flowName: string
  flowCode: string
  category?: string
  categoryName?: string
  formPath: string
  version: string
  isPublish: number
  activityStatus: number
  createTime: Date
  updateTime: Date
}

export interface FlowDefinitionForm {
  id: string
  flowName: string
  flowCode: string
  category: string
  ext: string
  formPath: string
  formCustom: string
  modelValue: string
}
