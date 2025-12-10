import type { AxiosPromise } from "axios"
import type { UserInfo } from "./types"
import { request } from "@/http/axios"

/**
 * 查询用户个人信息
 */
export function getInfoApi(): AxiosPromise<UserInfo> {
  return request({
    url: "/system/user/getInfo",
    method: "get"
  })
}
