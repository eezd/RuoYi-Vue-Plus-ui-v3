export interface OnlineQuery extends PageQuery {
  ipaddr: string
  userName: string
}

export interface OnlineVO extends BaseEntity {
  /**
   * 会话编号
   */
  tokenId: string
  /**
   * 用户名称
   */
  userName: string
  /**
   * 登录IP地址
   */
  ipaddr: string
  /**
   * 登录地址
   */
  loginLocation: string
  /**
   * 浏览器类型
   */
  browser: string
  /**
   * 操作系统
   */
  os: string
  /**
   * 登录时间
   */
  loginTime: number
  /**
   * 客户端
   */
  clientKey: string
  /**
   * 设备类型
   */
  deviceType: string
}
