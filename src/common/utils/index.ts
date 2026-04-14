import dayjs from "dayjs"

type QueryRecord = Record<string, unknown>
type DictValue = string | number | boolean
interface DictOption {
  value: DictValue
  label?: string | number
}
type TreeNode = Record<string, unknown>

/** 格式化日期时间；空值统一显示为 N/A。 */
export function formatDateTime(time: string | number | Date | null | undefined) {
  return time ? dayjs(new Date(time)).format("YYYY-MM-DD HH:mm:ss") : "N/A"
}

/** 获取全局 CSS 变量值。 */
export function getCssVariableValue(cssVariableName: string) {
  try {
    // 没有拿到值时，会返回空串
    return getComputedStyle(document.documentElement).getPropertyValue(cssVariableName)
  } catch (error) {
    console.error(error)
    return ""
  }
}

/** 设置全局 CSS 变量值。 */
export function setCssVariableValue(cssVariableName: string, cssVariableValue: string) {
  try {
    document.documentElement.style.setProperty(cssVariableName, cssVariableValue)
  } catch (error) {
    console.error(error)
  }
}

/**
 * 将查询参数序列化为 query string 片段。
 * 会跳过 null、undefined 和空字符串，并兼容一层嵌套对象。
 * @param params 查询参数
 */
export function tansParams(params: unknown) {
  if (!isRecord(params)) return ""

  let result = ""
  Object.keys(params).forEach((propName) => {
    const value = params[propName]
    if (isEmptyParamValue(value)) return

    if (isRecord(value) || Array.isArray(value)) {
      Object.keys(value).forEach((key) => {
        const itemValue = value[key as keyof typeof value]
        if (isEmptyParamValue(itemValue)) return

        const nestedKey = `${propName}[${key}]`
        result += `${encodeURIComponent(nestedKey)}=${encodeURIComponent(String(itemValue))}&`
      })
      return
    }

    result += `${encodeURIComponent(propName)}=${encodeURIComponent(String(value))}&`
  })

  return result
}

// 判断响应内容是否为可下载 Blob，而不是后端返回的 JSON 错误信息。
export function blobValidate(data: Pick<Blob, "type"> | null | undefined) {
  return data != null && data.type !== "application/json"
}

/**
 * 构造树型结构数据，并按 sortOrder 递归排序。
 * @param data 数据源
 * @param id id 字段 默认 "id"
 * @param parentId 父节点字段 默认 "parentId"
 * @param children 孩子节点字段 默认 "children"
 */
export function handleTree<T = TreeNode>(data: unknown[], id?: string, parentId?: string, children?: string): T[] {
  const config = {
    id: id || "id",
    parentId: parentId || "parentId",
    childrenList: children || "children"
  }
  const nodes = data.filter(isRecord) as TreeNode[]
  const childrenListMap = new Map<unknown, TreeNode>()
  const tree: TreeNode[] = []

  nodes.forEach((node) => {
    childrenListMap.set(node[config.id], node)
    if (!Array.isArray(node[config.childrenList])) {
      node[config.childrenList] = []
    }
  })

  nodes.forEach((node) => {
    const parentNode = childrenListMap.get(node[config.parentId])
    if (!parentNode) {
      tree.push(node)
      return
    }

    const childNodes = parentNode[config.childrenList]
    if (Array.isArray(childNodes)) {
      childNodes.push(node)
    }
  })

  return sortTree(tree, config.childrenList) as T[]
}

// 转换字符串，undefined、null 等后端占位值统一转化为 ""。
export function parseStrEmpty(str: unknown) {
  if (!str || str === "undefined" || str === "null") {
    return ""
  }
  return str
}

// 根据字典值回显单个字典标签。
export function selectDictLabel(datas: unknown, value: number | string) {
  if (value === undefined) return ""

  const matched = normalizeDictOptions(datas).find(item => String(item.value) === String(value))
  return matched && matched.label !== undefined && matched.label !== null ? String(matched.label) : String(value)
}

// 根据字典值回显多个字典标签。
export function selectDictLabels(datas: unknown, value: unknown, separator: string = ",") {
  if (value === undefined || value === null || value === "") return ""

  const values = Array.isArray(value) ? value.map(String) : String(value).split(separator)
  const dictOptions = normalizeDictOptions(datas)

  return values
    .filter(item => item !== "")
    .map((item) => {
      const matched = dictOptions.find(dict => String(dict.value) === item)
      return matched && matched.label !== undefined && matched.label !== null ? String(matched.label) : item
    })
    .join(separator)
}

/**
 * 判断 url 是否是 http 或 https 绝对地址。
 * @returns {boolean}
 * @param url
 */
export function isHttp(url: string): boolean {
  return /^https?:\/\//i.test(url)
}

function isRecord(value: unknown): value is QueryRecord {
  return value !== null && typeof value === "object" && !isBlob(value) && !(value instanceof Date)
}

function isBlob(value: unknown): value is Blob {
  return typeof Blob !== "undefined" && value instanceof Blob
}

function isEmptyParamValue(value: unknown) {
  return value === null || value === "" || typeof value === "undefined"
}

function sortTree(nodes: TreeNode[], childrenKey: string): TreeNode[] {
  return nodes
    // 递归排序每一层的 children，并按 sortOrder 排序；如果不存在则默认为 0
    .sort((a, b) => getSortOrder(a) - getSortOrder(b))
    .map((node) => {
      const children = node[childrenKey]
      if (Array.isArray(children) && children.length > 0) {
        // 递归排序子节点
        node[childrenKey] = sortTree(children.filter(isRecord) as TreeNode[], childrenKey)
      }
      return node
    })
}

function getSortOrder(node: TreeNode) {
  const sortOrder = Number(node.sortOrder ?? 0)
  return Number.isFinite(sortOrder) ? sortOrder : 0
}

function normalizeDictOptions(datas: unknown): DictOption[] {
  if (!datas || typeof datas !== "object") return []

  return Object.values(datas)
    .filter(isDictOption)
    .map(item => ({
      value: item.value,
      label: item.label
    }))
}

function isDictOption(value: unknown): value is DictOption {
  if (!value || typeof value !== "object") return false

  const option = value as Partial<DictOption>
  return ["string", "number", "boolean"].includes(typeof option.value)
}
