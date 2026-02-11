import { getSysDictDataApi } from "@@/apis/system/dict/data"
import { useDictStore } from "@/pinia/stores/dict"

/**
 * 获取字典数据
 */
export function useDict(...args: string[]): { [key: string]: DictDataOption[] } {
  const res = ref<{
    [key: string]: DictDataOption[]
  }>({})

  args.forEach(async (dictType) => {
    res.value[dictType] = []
    const dicts = useDictStore().getDict(dictType)
    if (dicts) {
      res.value[dictType] = dicts
    } else {
      await getSysDictDataApi(dictType).then((resp) => {
        res.value[dictType] = resp.data.map(
          (p): DictDataOption => ({ label: p.dictLabel, value: p.dictValue, elTagType: p.listClass, elTagClass: p.cssClass })
        )
        useDictStore().setDict(dictType, res.value[dictType])
      })
    }
  })
  return res.value
}
