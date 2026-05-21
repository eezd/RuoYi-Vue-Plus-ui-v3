/** 所有 api 接口的响应数据都应该准守该格式 */
interface ApiResponseData<T> {
  code: number
  data: T
  msg: string
}

interface ApiResponsePageData<T> {
  total: number
  code: number
  rows: T
  msg: string
}

/** 后端 6.X PageResult 分页数据结构 */
interface PageResult<T> {
  rows: T[]
  total: number
}
