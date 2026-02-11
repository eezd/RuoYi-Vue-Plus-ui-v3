export interface OperLogQuery extends PageQuery {
  operIp: string
  title: string
  operName: string
  businessType: string
  status: string
  orderByColumn: string
  isAsc: string
  params?: {
    beginTime?: string
    endTime?: string
  }
}

export interface OperLogVO extends BaseEntity {
  /**
   * 日志主键
   */
  operId: string | number
  /**
   * 模块标题
   */
  title: string
  /**
   * 业务类型（0其它 1新增 2修改 3删除）
   */
  businessType: number
  /**
   * 业务类型数组
   */
  businessTypes: number[] | undefined
  /**
   * 方法名称
   */
  method: string
  /**
   * 请求方式
   */
  requestMethod: string
  /**
   * 操作类别（0其它 1后台用户 2手机端用户）
   */
  operatorType: number
  /**
   * 操作人员
   */
  operName: string
  /**
   * 请求URL
   */
  operUrl: string
  /**
   * 主机地址
   */
  operIp: string
  /**
   * 操作地点
   */
  operLocation: string
  /**
   * 请求参数
   */
  operParam: string
  /**
   * 返回参数
   */
  jsonResult: string
  /**
   * 操作状态（0正常 1异常）
   */
  status: number
  /**
   * 错误消息
   */
  errorMsg: string
  /**
   * 操作时间
   */
  operTime: string
  /**
   * 消耗时间
   */
  costTime: number
}

export interface OperLogForm {
  /**
   * 日志主键
   */
  operId: number | string
  /**
   * 模块标题
   */
  title: string
  /**
   * 业务类型（0其它 1新增 2修改 3删除）
   */
  businessType: number
  /**
   * 业务类型数组
   */
  businessTypes: number[] | undefined
  /**
   * 方法名称
   */
  method: string
  /**
   * 请求方式
   */
  requestMethod: string
  /**
   * 操作类别（0其它 1后台用户 2手机端用户）
   */
  operatorType: number
  /**
   * 操作人员
   */
  operName: string
  /**
   * 请求URL
   */
  operUrl: string
  /**
   * 主机地址
   */
  operIp: string
  /**
   * 操作地点
   */
  operLocation: string
  /**
   * 请求参数
   */
  operParam: string
  /**
   * 返回参数
   */
  jsonResult: string
  /**
   * 操作状态（0正常 1异常）
   */
  status: number
  /**
   * 错误消息
   */
  errorMsg: string
  /**
   * 操作时间
   */
  operTime: string
  /**
   * 消耗时间
   */
  costTime: number
}
