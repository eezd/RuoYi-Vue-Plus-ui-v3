export interface NoticeVO extends BaseEntity {
  /**
   * 公告ID
   */
  noticeId: number
  /**
   * 公告标题
   */
  noticeTitle: string
  /**
   * 公告类型（1通知 2公告）
   */
  noticeType: string
  /**
   * 公告内容
   */
  noticeContent: string
  /**
   * 公告状态（0正常 1关闭）
   */
  status: string
  /**
   * 备注
   */
  remark: string
  createByName: string
}

export interface NoticeQuery extends PageQuery {
  noticeTitle: string
  createByName: string
  status: string
  noticeType: string
  params?: {
    beginTime?: string
    endTime?: string
  }
}

export interface NoticeForm {
  /**
   * 公告ID
   */
  noticeId: number | string
  /**
   * 公告标题
   */
  noticeTitle: string
  /**
   * 公告类型（1通知 2公告）
   */
  noticeType: string
  /**
   * 公告内容
   */
  noticeContent: string
  /**
   * 公告状态（0正常 1关闭）
   */
  status: string
  /**
   * 备注
   */
  remark: string
  createByName: string
}
