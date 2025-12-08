export enum ApiState {
  Disabled = 0,
  Enabled = 1
}

export enum ApiResourceType {
  MENU = "20",
  BUTTON = "40"
}

// 1男 2女 3未知
export enum ApiSexType {
  Male = "1",
  Female = "2",
  Other = "3"
}

// 0其它 1新增 2修改 3删除
export enum ApiBusinessType {
  Other = 0,
  Create = 1,
  Update = 2,
  Delete = 3
}

// 0其它 1后台用户 2手机端用户
export enum ApiOperatorType {
  Other = 0,
  BackendUser = 1,
  MobileUser = 2
}

// 通知类型;[0-全局 1-对角色 2-对用户]
export enum ApiNoticeType {
  ALL = 0,
  ROLE = 1,
  USER = 2
}
