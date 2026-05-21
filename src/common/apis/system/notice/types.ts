export interface NoticeVO extends BaseEntity {
  /** 公告ID */
  noticeId: number | string
  /** 公告标题 */
  noticeTitle: string
  /** 公告类型（1 通知，2 公告） */
  noticeType: string
  /** 公告内容 */
  noticeContent?: string
  /** 公告状态（0 正常，1 关闭） */
  status: string
  /** 备注 */
  remark?: string
  /** 创建者用户 ID */
  createBy?: number | string
  /** 创建人名称 */
  createByName?: string
}

export interface NoticeQuery extends PageQuery {
  noticeTitle?: string
  createByName?: string
  status?: string
  noticeType?: string
  params?: {
    beginTime?: string
    endTime?: string
  }
}

export interface NoticeForm {
  /** 公告ID */
  noticeId?: number | string
  /** 公告标题 */
  noticeTitle?: string
  /** 公告类型（1 通知，2 公告） */
  noticeType?: string
  /** 公告内容 */
  noticeContent?: string
  /** 公告状态（0 正常，1 关闭） */
  status?: string
  /** 备注 */
  remark?: string
  /** 创建人名称 */
  createByName?: string
}
