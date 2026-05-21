export function normalizePageResult<T>(response: ApiResponseData<PageResult<T>>): ApiResponsePageData<T[]> {
  return {
    code: response.code,
    msg: response.msg,
    rows: response.data?.rows || [],
    total: response.data?.total || 0
  }
}
