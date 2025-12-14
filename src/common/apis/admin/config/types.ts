export interface ConfigVO extends BaseEntity {
  /**
   * 参数主键
   */
  configId: number | string
  /**
   * 参数键名
   */
  configKey: string
  /**
   * 参数名称
   */
  configName: string
  /**
   * 系统内置（Y是 N否）
   */
  configType: string
  /**
   * 参数键值
   */
  configValue: string
  /**
   * 备注
   */
  remark: string
}

export interface ConfigForm {
  /**
   * 参数主键
   */
  configId: number | string
  /**
   * 参数键名
   */
  configKey: string
  /**
   * 参数名称
   */
  configName: string
  /**
   * 系统内置（Y是 N否）
   */
  configType: string
  /**
   * 参数键值
   */
  configValue: string
  /**
   * 备注
   */
  remark: string
}

export interface ConfigQuery extends PageQuery {
  /**
   * 参数键名
   */
  configKey: string
  /**
   * 参数名称
   */
  configName: string
  /**
   * 系统内置（Y是 N否）
   */
  configType: string
  params?: {
    beginTime?: string
    endTime?: string
  }
}
