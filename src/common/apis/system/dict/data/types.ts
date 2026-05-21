export interface DictDataQuery extends PageQuery {
  dictType?: string
  dictLabel?: string
}

export type DictDataListClass = "" | "default" | ElTagType

export interface DictDataVO extends BaseEntity {
  /** 字典编码 */
  dictCode: number | string
  /** 字典标签 */
  dictLabel: string
  /** 字典键值 */
  dictValue: string
  /** 字典类型 */
  dictType: string
  /** 样式属性（其他样式扩展） */
  cssClass?: string
  /** 表格回显样式 */
  listClass?: DictDataListClass
  /** 是否默认（Y 是，N 否） */
  isDefault?: string
  /** 字典排序 */
  dictSort: number
  /** 备注 */
  remark?: string
}

export interface DictDataForm {
  /** 字典编码 */
  dictCode?: number | string
  /** 字典类型 */
  dictType?: string
  /** 字典标签 */
  dictLabel?: string
  /** 字典键值 */
  dictValue?: string
  /** 样式属性（其他样式扩展） */
  cssClass?: string
  /** 表格回显样式 */
  listClass?: DictDataListClass
  /** 是否默认（Y 是，N 否） */
  isDefault?: string
  /** 字典排序 */
  dictSort?: number
  /** 备注 */
  remark?: string
}
