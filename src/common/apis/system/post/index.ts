import type { DeptTreeVO } from "../dept/types"
import type { PostForm, PostQuery, PostVO } from "./types"
import { request } from "@/http/axios.ts"

// 查询岗位列表
export function getSysPostListApi(query: PostQuery) {
  return request<ApiResponseData<PostVO[]>>({
    url: "/system/post/list",
    method: "get",
    params: query
  })
}

// 查询岗位详细
export function getSysPostApi(postId: string | number) {
  return request<ApiResponseData<PostVO>>({
    url: `/system/post/${postId}`,
    method: "get"
  })
}

// 获取岗位选择框列表
export function getSysPostOptionselectApi(deptId?: number | string, postIds?: (number | string)[]) {
  return request<ApiResponseData<PostVO[]>>({
    url: "/system/post/optionselect",
    method: "get",
    params: {
      postIds,
      deptId
    }
  })
}

// 新增岗位
export function addSysPostApi(data: PostForm) {
  return request({
    url: "/system/post",
    method: "post",
    data
  })
}

// 修改岗位
export function updateSysPostApi(data: PostForm) {
  return request({
    url: "/system/post",
    method: "put",
    data
  })
}

// 删除岗位
export function delSysPostApi(postId: string | number | (string | number)[]) {
  return request({
    url: `/system/post/${postId}`,
    method: "delete"
  })
}

/**
 * 查询部门下拉树结构
 */
export function getSysDeptTreeSelectApi() {
  return request<ApiResponseData<DeptTreeVO[]>>({
    url: "/system/post/deptTree",
    method: "get"
  })
}
