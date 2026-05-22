export interface TaskQuery extends PageQuery {
  nodeName?: string
  flowCode?: string
  flowName?: string
  createByIds?: Array<string | number>
}

export interface FlowParticipantVO {
  groupIds?: Array<string | number>
  candidate: Array<string | number>
  candidateName: string[]
  claim: boolean
}

export interface FlowButtonVO {
  code: string
  show: boolean
}

export interface FlowCopyVO {
  userId: string | number
  nickName: string
}

export interface FlowNodeVO {
  id?: string | number
  nodeCode?: string
  nodeName?: string
  nodeType?: number
  permissionFlag?: string
  [key: string]: any
}

export interface WorkflowUserDTO {
  userId: string | number
  userName?: string
  nickName?: string
  [key: string]: any
}

export interface FlowNextNodeForm {
  taskId?: string | number
  flowCode?: string
  variables?: Record<string, any>
  [key: string]: any
}

export interface TaskOperationForm {
  userId?: string | number
  userIds?: Array<string | number>
  taskId: string | number
  messageType?: string[]
  message?: string
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
  applyNode?: boolean
  buttonList?: FlowButtonVO[]
  copyList?: FlowCopyVO[]
  varList?: Record<string, any>
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
