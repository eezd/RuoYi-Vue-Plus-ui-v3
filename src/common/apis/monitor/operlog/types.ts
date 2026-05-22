export interface OperLogQuery extends PageQuery {
  operIp?: string | number
  title?: string
  operName?: string
  userId?: string | number
  deptId?: string | number
  clientKey?: string
  deviceType?: string
  browser?: string
  os?: string
  businessType?: string | number
  status?: string | number
  orderByColumn?: string
  isAsc?: string
  params?: {
    beginTime?: string
    endTime?: string
  }
}

export interface OperLogVO extends BaseEntity {
  operId: string | number
  title: string
  businessType: number
  businessTypes: number[] | undefined
  method: string
  requestMethod: string
  operatorType: number
  operName: string
  userId: string | number
  deptId: string | number
  deptName: string
  clientKey: string
  deviceType: string
  browser: string
  os: string
  operUrl: string
  operIp: string
  operLocation: string
  operParam: string
  jsonResult: string
  status: number
  errorMsg: string
  operTime: string
  costTime: number
}

export interface OperLogForm {
  operId: number | string
  title: string
  businessType: number
  businessTypes: number[]
  method: string
  requestMethod: string
  operatorType: number
  operName: string
  userId: string | number
  deptId: string | number
  deptName: string
  clientKey: string
  deviceType: string
  browser: string
  os: string
  operUrl: string
  operIp: string
  operLocation: string
  operParam: string
  jsonResult: string
  status: number
  errorMsg: string
  operTime: string
  costTime: number
}
