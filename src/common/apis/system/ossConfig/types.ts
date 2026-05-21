export interface OssConfigVO extends BaseEntity {
  /** OSS配置ID */
  ossConfigId: number | string
  /** 配置key */
  configKey: string
  /** accessKey */
  accessKey: string
  /** secretKey */
  secretKey: string
  /** 桶名称 */
  bucketName: string
  /** 前缀 */
  prefix?: string
  /** 访问站点 */
  endpoint: string
  /** 自定义域名 */
  domainUrl?: string
  /** 是否HTTPS（Y 是，N 否） */
  isHttps?: string
  /** 域 */
  region?: string
  /** 是否默认（Y 是，N 否） */
  status: string
  /** 扩展字段 */
  ext1?: string
  /** 备注 */
  remark?: string
  /** 桶权限类型（0 private，1 public，2 custom） */
  accessPolicy: string
}

export interface OssConfigQuery extends PageQuery {
  /** 配置key */
  configKey?: string
  /** 桶名称 */
  bucketName?: string
  /** 是否默认（Y 是，N 否） */
  status?: string
}

export interface OssConfigForm {
  /** OSS配置ID */
  ossConfigId?: string | number
  /** 配置key */
  configKey?: string
  /** accessKey */
  accessKey?: string
  /** secretKey */
  secretKey?: string
  /** 桶名称 */
  bucketName?: string
  /** 前缀 */
  prefix?: string
  /** 访问站点 */
  endpoint?: string
  /** 自定义域名 */
  domainUrl?: string
  /** 是否HTTPS（Y 是，N 否） */
  isHttps?: string
  /** 桶权限类型（0 private，1 public，2 custom） */
  accessPolicy?: string
  /** 域 */
  region?: string
  /** 是否默认（Y 是，N 否） */
  status?: string
  /** 扩展字段 */
  ext1?: string
  /** 备注 */
  remark?: string
}
