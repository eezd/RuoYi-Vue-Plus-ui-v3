<script lang="ts" setup>
import type { DateModelType, FormInstance } from "element-plus"
import type { DictTypeQuery } from "@/common/apis/admin/dict/type/types"
import { Refresh, Search } from "@element-plus/icons-vue"
import { ref } from "vue"

const emit = defineEmits<EmitEvents>()
/**
 * defineModel
 */
// #region defineModel
const loading = defineModel<boolean>("loading", { required: true })
const searchData = defineModel<DictTypeQuery>("searchData", { required: true })
// #endregion

/**
 * EmitEvents
 */
// #region EmitEvents
export interface EmitEvents {
  getTableData: [params?: DictTypeQuery]
}
function handleSearch() {
  emit("getTableData", searchData.value)
}
// #endregion

const searchFormRef = ref<FormInstance | null>(null)

const dateRange = ref<[DateModelType, DateModelType]>(["", ""])
watch(dateRange, ([newBeginTime, newEndTime]) => {
  searchData.value.beginTime = newBeginTime
  searchData.value.endTime = newEndTime
})

function resetSearch() {
  searchFormRef.value?.resetFields()
  dateRange.value = ["", ""]
  handleSearch()
}
</script>

<template>
  <el-card v-loading="loading" shadow="never" class="search-wrapper">
    <el-form ref="searchFormRef" :inline="true" :model="searchData">
      <el-form-item prop="dictName" label="字典名称">
        <el-input v-model="searchData.dictName" placeholder="请输入字典名称" @keyup.enter="handleSearch" />
      </el-form-item>
      <el-form-item prop="dictType" label="字典类型">
        <el-input v-model="searchData.dictType" placeholder="请输入字典类型" @keyup.enter="handleSearch" />
      </el-form-item>
      <el-form-item label="创建时间" style="width: 308px">
        <el-date-picker
          v-model="dateRange"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" @click="handleSearch">
          查询
        </el-button>
        <el-button :icon="Refresh" @click="resetSearch">
          重置
        </el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<style lang="scss" scoped>
.search-wrapper {
  margin-bottom: 20px;
  :deep(.el-card__body) {
    padding-bottom: 2px;
  }
}
</style>
