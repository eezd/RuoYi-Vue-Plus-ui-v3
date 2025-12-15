export interface LoginRequestData {
  username?: string
  password?: string
  rememberMe?: boolean
  socialCode?: string
  socialState?: string
  source?: string
  code?: string
  uuid?: string
  clientId: string
  grantType: string
}

export interface CaptchaInfo {
  captchaEnabled: boolean
  uuid?: string
  img?: string
}

/**
 * LoginVo，登录验证信息
 */
export interface LoginInfo {
  /**
   * 授权令牌
   */
  access_token?: string
  /**
   * 应用id
   */
  client_id?: string
  /**
   * 授权令牌 access_token 的有效期
   */
  expire_in?: number
  /**
   * 用户 openid
   */
  openid?: string
  /**
   * 刷新令牌 refresh_token 的有效期
   */
  refresh_expire_in?: number
  /**
   * 刷新令牌
   */
  refresh_token?: string
  /**
   * 令牌权限
   */
  scope?: string
  [property: string]: any
}

/**
 * 登录请求
 */
export interface LoginData {
  tenantId?: string
  username?: string
  password?: string
  rememberMe?: boolean
  socialCode?: string
  socialState?: string
  source?: string
  code?: string
  uuid?: string
  clientId: string
  grantType: string
}
