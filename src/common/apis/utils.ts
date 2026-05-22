type PageLike<T> = ApiResponseData<PageResult<T>> | ApiResponsePageData<T[]>

function toFiniteNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

function resolvePagePayload<T>(response: PageLike<T>) {
  if ("data" in response && response.data && typeof response.data === "object") {
    return response.data as PageResult<T>
  }
  return response as ApiResponsePageData<T[]>
}

export function normalizePageResult<T>(response: PageLike<T>): ApiResponsePageData<T[]> {
  const payload = resolvePagePayload(response)

  return {
    code: response.code,
    msg: response.msg,
    rows: Array.isArray(payload.rows) ? payload.rows : [],
    total: toFiniteNumber(payload.total)
  }
}
