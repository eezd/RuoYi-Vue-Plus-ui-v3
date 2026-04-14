type CacheValue = string | number | boolean
interface DefaultJSONValue {
  url: string
  data: unknown
  time: number
}

interface CacheStore {
  set: (key: string, value: CacheValue) => void
  get: (key: string) => string | null
  setJSON: <T>(key: string, jsonValue: T) => void
  getJSON: <T = DefaultJSONValue>(key: string) => T | null
  remove: (key: string) => void
}

function createCacheStore(getStorage: () => Storage | undefined): CacheStore {
  return {
    set(key, value) {
      const storage = getStorage()
      if (!storage || key == null || value == null) return
      storage.setItem(key, String(value))
    },
    get(key) {
      const storage = getStorage()
      if (!storage || key == null) return null
      return storage.getItem(key)
    },
    setJSON<T>(key: string, jsonValue: T) {
      if (jsonValue == null) return
      this.set(key, JSON.stringify(jsonValue))
    },
    getJSON<T = DefaultJSONValue>(key: string) {
      const value = this.get(key)
      if (value == null) return null

      try {
        return JSON.parse(value) as T
      } catch {
        return null
      }
    },
    remove(key) {
      getStorage()?.removeItem(key)
    }
  }
}

const sessionCache = createCacheStore(() => (typeof sessionStorage === "undefined" ? undefined : sessionStorage))
const localCache = createCacheStore(() => (typeof localStorage === "undefined" ? undefined : localStorage))

export default {
  /**
   * 会话级缓存，浏览器标签页关闭后自动清理。
   */
  session: sessionCache,
  /**
   * 本地缓存，长期保留用户偏好和可复用状态。
   */
  local: localCache
}
