export interface DictTypeVO extends BaseEntity {
  /**
   * 字典主键
   */
  dictId: number | string
  /**
   * 字典名称
   */
  dictName: string
  /**
   * 字典类型
   */
  dictType: string
  /**
   * 备注
   */
  remark: string
}

export interface DictTypeForm {
  /**
   * 字典主键
   */
  dictId: number | string
  /**
   * 字典名称
   */
  dictName: string
  /**
   * 字典类型
   */
  dictType: string
  /**
   * 备注
   */
  remark: string
}

export interface DictTypeQuery extends PageQuery {
  /**
   * 字典名称
   */
  dictName: string
  /**
   * 字典类型
   */
  dictType: string
  params?: {
    beginTime?: string
    endTime?: string
  }
}
