/** 判断是否为数组，同时收窄 TypeScript 类型。 */
export function isArray<T = unknown>(arg: unknown): arg is T[] {
  return Array.isArray(arg)
}

/** 判断是否为字符串，同时收窄 TypeScript 类型。 */
export function isString(str: unknown): str is string {
  return typeof str === "string"
}

/** 判断是否为外链地址。 */
export function isExternal(path: string): boolean {
  return /^(https?:|mailto:|tel:)/.test(path)
}
