import type { NoticeForm, NoticeQuery, NoticeVO } from "./types"
import { request } from "@/http/axios"

// 查询公告列表
export function getSysNoticeListApi(query: NoticeQuery) {
  return request<ApiResponsePageData<NoticeVO[]>>({
    url: "/system/notice/list",
    method: "get",
    params: query
  })
}

// 查询公告详细
export function getSysNoticeApi(noticeId: string | number) {
  return request<ApiResponseData<NoticeVO>>({
    url: `/system/notice/${noticeId}`,
    method: "get"
  })
}

// 新增公告
export function addSysNoticeApi(data: NoticeForm) {
  return request<ApiResponseData<null>>({
    url: "/system/notice",
    method: "post",
    data
  })
}

// 修改公告
export function updateSysNoticeApi(data: NoticeForm) {
  return request<ApiResponseData<null>>({
    url: "/system/notice",
    method: "put",
    data
  })
}

// 删除公告
export function delSysNoticeApi(noticeId: string | number | Array<string | number>) {
  return request<ApiResponseData<null>>({
    url: `/system/notice/${noticeId}`,
    method: "delete"
  })
}
