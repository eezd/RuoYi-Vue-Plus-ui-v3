/** 所有 api 接口的响应数据都应该准守该格式 */
interface ApiResponseData<T> {
  code: number
  data: T
  msg: string
}

interface ApiResponseListData<T> {
  total: number
  code: number
  rows: T
  msg: string
}

interface ApiResponsePageData<T> {
  total: number
  code: number
  rows: T
  msg: string
}
