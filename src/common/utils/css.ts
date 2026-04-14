/** 获取指定元素（默认全局）上的 CSS 变量值。 */
export function getCssVar(varName: string, element: HTMLElement = document.documentElement) {
  if (!isCssVarName(varName)) {
    console.error("CSS variable name should start with '--'")
    return ""
  }
  // 没有拿到值时，getPropertyValue 会返回空串。
  return getComputedStyle(element).getPropertyValue(varName)
}

/** 设置指定元素（默认全局）上的 CSS 变量值。 */
export function setCssVar(varName: string, value: string, element: HTMLElement = document.documentElement) {
  if (!isCssVarName(varName)) {
    console.error("CSS variable name should start with '--'")
    return
  }
  element.style.setProperty(varName, value)
}

function isCssVarName(varName: string) {
  return varName.startsWith("--")
}
