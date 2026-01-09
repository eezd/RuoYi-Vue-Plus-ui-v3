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

/**
 * 参数处理
 * @param {*} params  参数
 */
export function tansParams(params: Record<string, any>): string {
  let result = ""
  for (const propName of Object.keys(params)) {
    const value = params[propName]

    // 跳过 null, undefined, 空字符串
    if (value === null || value === undefined || value === "") {
      continue
    }

    if (typeof value === "object") {
      for (const key of Object.keys(value)) {
        const subValue = value[key]
        if (subValue !== null && subValue !== undefined && subValue !== "") {
          // 正确编码嵌套键
          const fullKey = `${propName}[${key}]`
          result += `${encodeURIComponent(fullKey)}=${encodeURIComponent(subValue)}&`
        }
      }
    } else {
      result += `${encodeURIComponent(propName)}=${encodeURIComponent(value)}&`
    }
  }

  return result.slice(0, -1) // 去掉最后的 &
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

// 回显数据字典
export function selectDictLabel(datas: any, value: number | string) {
  if (value === undefined) {
    return ""
  }
  const actions: Array<string | number> = []
  Object.keys(datas).some((key) => {
    if (datas[key].value === `${value}`) {
      actions.push(datas[key].label)
      return true
    }
    return false
  })
  if (actions.length === 0) {
    actions.push(value)
  }
  return actions.join("")
}

// 回显数据字典（字符串数组）
export function selectDictLabels(datas: any, value: any, separator: any) {
  if (value === undefined || value.length === 0) {
    return ""
  }
  if (Array.isArray(value)) {
    value = value.join(",")
  }
  const actions: any[] = []
  const currentSeparator = undefined === separator ? "," : separator
  const temp = value.split(currentSeparator)

  Object.keys(temp).some((val) => {
    let match = false
    Object.keys(datas).some((key) => {
      if (datas[key].value === `${temp[val]}`) {
        actions.push(datas[key].label + currentSeparator)
        match = true
        return true
      }
      return false
    })
    if (!match) {
      actions.push(temp[val] + currentSeparator)
    }

    return match
  })

  return actions.join("").substring(0, actions.join("").length - 1)
}
