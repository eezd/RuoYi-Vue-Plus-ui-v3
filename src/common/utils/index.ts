import { ApiBusinessType, ApiOperatorType } from "@@/constants/api-key"
import dayjs from "dayjs"

/** 格式化时间 */
export function formatDateTime(time: string | number | Date | null | undefined) {
  return time ? dayjs(new Date(time)).format("YYYY-MM-DD HH:mm:ss") : "N/A"
}

/** 用 JS 获取全局 css 变量 */
export function getCssVariableValue(cssVariableName: string) {
  let cssVariableValue = ""
  try {
    // 没有拿到值时，会返回空串
    cssVariableValue = getComputedStyle(document.documentElement).getPropertyValue(cssVariableName)
  } catch (error) {
    console.error(error)
  }
  return cssVariableValue
}

/** 用 JS 设置全局 CSS 变量 */
export function setCssVariableValue(cssVariableName: string, cssVariableValue: string) {
  try {
    document.documentElement.style.setProperty(cssVariableName, cssVariableValue)
  } catch (error) {
    console.error(error)
  }
}

// 过滤空值, 用于传参
export function filterAndTrimValues(obj?: any): any {
  // 如果 obj 为 null 或 undefined，返回空对象
  if (obj == null) {
    return {}
  }
  // 创建一个新的对象来存储过滤后的值
  const filtered: any = {}

  for (const key in obj) {
    let value = obj[key]

    if (Array.isArray(value)) {
      // 处理数组中的元素
      const filteredArray = value.filter(item => item != null && item !== "")
      if (filteredArray.length > 0) {
        filtered[key] = filteredArray
      }
    } else if (typeof value === "object" && value !== null) {
      // 处理对象中的属性（递归调用）
      const filteredObject = filterAndTrimValues(value)
      if (Object.keys(filteredObject).length > 0) {
        filtered[key] = filteredObject
      }
    } else if (typeof value === "string") {
      // 处理字符串：去除前后空白并检查非空
      value = value.trim()
      if (value !== "") {
        filtered[key] = value
      }
    } else if (value !== null && value !== "") {
      // 处理非字符串类型：过滤掉 null 和空字符串
      filtered[key] = value
    }
  }

  return filtered
}

// 判断2个对象的变化，返回变化的字段
export function getChangedFields(original: any, current: any) {
  const changedFields: Record<string, any> = {}
  for (const key in current) {
    // 如果值是对象，直接跳过
    if (typeof current[key] === "object" && current[key] !== null) {
      continue
    }
    // 判断字段是否发生变化
    if (current[key] !== original[key]) {
      changedFields[key] = current[key]
    }
  }
  // 如果没有变化，返回 null
  return Object.keys(changedFields).length > 0 ? changedFields : null
}

export function getBusinessTypeText(type: ApiBusinessType | undefined): string {
  switch (type) {
    case ApiBusinessType.Other:
      return "其它"
    case ApiBusinessType.Create:
      return "新增"
    case ApiBusinessType.Update:
      return "修改"
    case ApiBusinessType.Delete:
      return "删除"
    default:
      return "未知"
  }
}

export function getOperatorTypeText(type: ApiOperatorType): string {
  switch (type) {
    case ApiOperatorType.Other:
      return "其它"
    case ApiOperatorType.BackendUser:
      return "后台用户"
    case ApiOperatorType.MobileUser:
      return "手机端用户"
    default:
      return "未知"
  }
}

/**
 * 添加日期范围
 * @param dateRange 日期范围，包含开始时间和结束时间
 * @param propName 属性名，可选
 * @returns { beginTime: any, endTime: any } 返回一个包含开始时间和结束时间的对象
 */
export function formartDateRange(dateRange: any[], propName?: string) {
  // 解构 dateRange 数组，得到 beginTime 和 endTime
  const [beginTime, endTime] = dateRange

  // 如果传入了 propName，构建带有 propName 的属性名
  if (propName) {
    return {
      [`begin${propName}`]: beginTime,
      [`end${propName}`]: endTime
    }
  }

  // 如果没有 propName，直接返回默认的属性名
  return { beginTime, endTime }
}

/**
 * 参数处理
 * @param {*} params  参数
 */
export function tansParams(params: any) {
  let result = ""
  for (const propName of Object.keys(params)) {
    const value = params[propName]
    const part = `${encodeURIComponent(propName)}=`
    if (value !== null && value !== "" && typeof value !== "undefined") {
      if (typeof value === "object") {
        for (const key of Object.keys(value)) {
          if (value[key] !== null && value[key] !== "" && typeof value[key] !== "undefined") {
            const params = `${propName}[${key}]`
            const subPart = `${encodeURIComponent(params)}=`
            result += `${subPart + encodeURIComponent(value[key])}&`
          }
        }
      } else {
        result += `${part + encodeURIComponent(value)}&`
      }
    }
  }
  return result
}

// 验证是否为blob格式
export function blobValidate(data: any) {
  return data.type !== "application/json"
}

/**
 * 构造树型结构数据
 * @param {*} data 数据源
 * @param {*} id id字段 默认 'id'
 * @param {*} parentId 父节点字段 默认 'parentId'
 * @param {*} children 孩子节点字段 默认 'children'
 */
export function handleTree<T>(data: any[], id?: string, parentId?: string, children?: string): T[] {
  const config: {
    id: string
    parentId: string
    childrenList: string
  } = {
    id: id || "id",
    parentId: parentId || "parentId",
    childrenList: children || "children"
  }

  const childrenListMap: any = {}
  const tree: T[] = []
  for (const d of data) {
    const id = d[config.id]
    childrenListMap[id] = d
    if (!d[config.childrenList]) {
      d[config.childrenList] = []
    }
  }

  for (const d of data) {
    const parentId = d[config.parentId]
    const parentObj = childrenListMap[parentId]
    if (!parentObj) {
      tree.push(d)
    } else {
      parentObj[config.childrenList].push(d)
    }
  }

  // 递归排序每一层的 children，并按 sortOrder 排序
  const sortTree = (nodes: any[]) => {
    return nodes
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)) // 按照 sortOrder 排序，如果不存在则默认为 0
      .map((node) => {
        if (node[config.childrenList] && node[config.childrenList].length > 0) {
          node[config.childrenList] = sortTree(node[config.childrenList]) // 递归排序子节点
        }
        return node
      })
  }

  return sortTree(tree)
}

// 转换字符串，undefined,null等转化为""
export function parseStrEmpty(str: any) {
  if (!str || str === "undefined" || str === "null") {
    return ""
  }
  return str
}
