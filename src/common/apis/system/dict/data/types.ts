export interface DictDataQuery extends PageQuery {
  dictName: string
  dictType: string
  dictLabel: string
}

export interface DictDataVO extends BaseEntity {
  /**
   * 样式属性（其他样式扩展）
   */
  cssClass: string
  /**
   * 字典编码
   */
  dictCode: number
  /**
   * 字典标签
   */
  dictLabel: string
  /**
   * 字典排序
   */
  dictSort: number
  /**
   * 字典类型
   */
  dictType: string
  /**
   * 字典键值
   */
  dictValue: string
  /**
   * 表格回显样式
   */
  listClass: ElTagType
  /**
   * 备注
   */
  remark: string
}

export interface DictDataForm {
  /**
   * 字典编码
   */
  dictCode: number | string
  /**
   * 字典标签
   */
  dictLabel: string
  /**
   * 字典排序
   */
  dictSort: number
  /**
   * 字典类型
   */
  dictType: string
  /**
   * 字典键值
   */
  dictValue: string
  /**
   * 样式属性（其他样式扩展）
   */
  cssClass: string
  /**
   * 表格回显样式
   */
  listClass: ElTagType
  remark: string
}
