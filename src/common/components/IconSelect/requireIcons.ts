import type { SvgName } from "~virtual/svg-component"

const icons: SvgName[] = []
const modules = import.meta.glob("./../../assets/icons/*.svg")
for (const path in modules) {
  const p = path.split("assets/icons/")[1].split(".svg")[0] as SvgName
  icons.push(p)
}
export default icons.sort((a, b) => a.localeCompare(b))
