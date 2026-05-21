export interface OssVO extends BaseEntity {
  /** OSS对象ID */
  ossId: string | number
  /** 文件名 */
  fileName: string
  /** 原始文件名 */
  originalName: string
  /** 文件后缀 */
  fileSuffix: string
  /** URL地址 */
  url: string
  /** 扩展字段 */
  ext1?: string
  /** 创建时间 */
  createTime?: string
  /** 上传人ID */
  createBy?: string | number
  /** 上传人名称 */
  createByName?: string
  /** 服务商 */
  service: string
}

export interface OssQuery extends PageQuery {
  /** 文件名 */
  fileName?: string
  /** 原始文件名 */
  originalName?: string
  /** 文件后缀 */
  fileSuffix?: string
  /** URL地址 */
  url?: string
  /** 扩展字段 */
  ext1?: string
  /** 服务商 */
  service?: string
  /** 上传人ID */
  createBy?: string | number
  orderByColumn?: string
  isAsc?: string
  params?: {
    beginCreateTime?: string
    endCreateTime?: string
  }
}

export interface OssForm {
  file?: string
}
