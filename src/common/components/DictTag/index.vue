<script setup lang="ts">
import { computed } from "vue"

// 定义字典选项类型
interface DictDataOption {
  value: string | number
  label: string
  elTagType?: "" | "default" | "primary" | "success" | "info" | "warning" | "danger"
  elTagClass?: string
}

// 定义 el-tag 允许的类型
type ElTagType = "primary" | "success" | "info" | "warning" | "danger"

interface Props {
  options?: DictDataOption[]
  value?: number | string | (number | string)[] | null
  showValue?: boolean
  separator?: string
}

const props = withDefaults(defineProps<Props>(), {
  options: () => [],
  value: undefined,
  showValue: true,
  separator: ","
})

// 判断值是否为空
function isEmpty(val: unknown): boolean {
  return val === "" || val === null || val === undefined
}

// 将 value 转换为字符串数组
const values = computed<string[]>(() => {
  if (isEmpty(props.value)) return []

  if (Array.isArray(props.value)) {
    return props.value.map(item => String(item))
  }

  return String(props.value).split(props.separator)
})

// 获取未匹配的值
const unmatchedValues = computed<string[]>(() => {
  if (props.options.length === 0 || isEmpty(props.value)) return []

  return values.value.filter(
    val => !props.options.some(opt => String(opt.value) === val)
  )
})

// 是否存在未匹配项
const hasUnmatched = computed(() => unmatchedValues.value.length > 0)

// 未匹配项的显示文本
const unmatchedText = computed(() => {
  return unmatchedValues.value.join(" ")
})

// 判断是否为有效的 el-tag type
function getValidTagType(type?: string): ElTagType {
  const validTypes: ElTagType[] = ["primary", "success", "info", "warning", "danger"]
  return validTypes.includes(type as ElTagType) ? (type as ElTagType) : "primary"
}

// 判断是否应该渲染为 el-tag
function shouldRenderAsTag(item: DictDataOption): boolean {
  return !(!item.elTagType || item.elTagType === "default") || !(!item.elTagClass || item.elTagClass === "")
  // return !(!item.elTagType || item.elTagType === "default" || item.elTagType === "") || !(!item.elTagClass || item.elTagClass === "")
}
</script>

<template>
  <div class="dict-tag-container">
    <template
      v-for="(item) in options"
      :key="item.value"
    >
      <template v-if="values.includes(String(item.value))">
        <!-- 普通文本显示 -->
        <span
          v-if="!shouldRenderAsTag(item)"
          :class="item.elTagClass"
        >
          {{ item.label }}
        </span>

        <!-- el-tag 显示 -->
        <el-tag
          v-else
          :type="getValidTagType(item.elTagType)"
          :class="item.elTagClass"
          :disable-transitions="true"
        >
          {{ item.label }}
        </el-tag>
      </template>
    </template>

    <!-- 显示未匹配的值 -->
    <span
      v-if="hasUnmatched && showValue"
      class="unmatched-values"
    >
      {{ unmatchedText }}
    </span>
  </div>
</template>

<style lang="scss" scoped>
.dict-tag-container {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.unmatched-values {
  color: var(--el-color-info);
}
</style>
