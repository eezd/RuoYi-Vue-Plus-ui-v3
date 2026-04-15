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

const props = withDefaults(defineProps<Props>(), {
  options: () => [],
  value: undefined,
  showValue: true,
  separator: ","
})

const validTagTypes = new Set<ElTagType>(["primary", "success", "info", "warning", "danger"])

interface Props {
  options?: DictDataOption[]
  value?: number | string | (number | string)[] | null
  showValue?: boolean
  separator?: string
}

// 判断值是否为空
function isEmpty(val: unknown): boolean {
  return val === "" || val === null || val === undefined
}

// 将传入值统一转为字符串数组，兼容后端逗号分隔和数组两种格式
const values = computed<string[]>(() => {
  if (isEmpty(props.value)) return []

  if (Array.isArray(props.value)) {
    return props.value.map(item => String(item)).filter(Boolean)
  }

  return String(props.value).split(props.separator).map(item => item.trim()).filter(Boolean)
})

const valueSet = computed(() => new Set(values.value))

const optionValueSet = computed(() => new Set(props.options.map(item => String(item.value))))

const matchedOptions = computed(() => {
  if (valueSet.value.size === 0) return []
  return props.options.filter(item => valueSet.value.has(String(item.value)))
})

// 获取未匹配的值
const unmatchedValues = computed<string[]>(() => {
  if (props.options.length === 0 || isEmpty(props.value)) return []

  return values.value.filter(val => !optionValueSet.value.has(val))
})

// 是否存在未匹配项
const hasUnmatched = computed(() => unmatchedValues.value.length > 0)

// 未匹配项的显示文本
const unmatchedText = computed(() => {
  return unmatchedValues.value.join(" ")
})

// 判断是否为有效的 el-tag type
function getValidTagType(type?: string): ElTagType {
  return validTagTypes.has(type as ElTagType) ? (type as ElTagType) : "primary"
}

// 判断是否应该渲染为 el-tag
function shouldRenderAsTag(item: DictDataOption): boolean {
  return Boolean((item.elTagType && item.elTagType !== "default") || item.elTagClass)
}
</script>

<template>
  <div class="dict-tag-container">
    <template
      v-for="item in matchedOptions"
      :key="item.value"
    >
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
