<script lang="ts" setup>
import type { PaginationData } from "@@/composables/usePagination.ts"
import type { SpelForm, SpelVO } from "@/common/apis/workflow/spel/types"
import DictTag from "@@/components/DictTag/index.vue"
import { useDevice } from "@@/composables/useDevice.ts"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { ref } from "vue"
import { useDict } from "@/common/composables/useDict"

const emit = defineEmits<EmitEvents>()
/**
 * defineModel
 */
// #region defineModel
const tableData = defineModel<SpelVO[]>("tableData", { required: true })
const paginationData = defineModel<PaginationData>("paginationData", { required: true })
const loading = defineModel<boolean>("loading", { required: true })
// #endregion

/**
 * EmitEvents
 */
// #region EmitEvents
export interface EmitEvents {
  openAddDialog: []
  handleDelete: [rows: SpelForm[]]
  handleSizeChange: [val: number]
  handleCurrentChange: [val: number]
  getTableData: []
}
const openAddDialog = () => emit("openAddDialog")
const handleDelete = (rows: SpelForm[]) => emit("handleDelete", rows)
const handleSizeChange = (val: number) => emit("handleSizeChange", val)
const handleCurrentChange = (val: number) => emit("handleCurrentChange", val)
const getTableData = () => emit("getTableData")
// #endregion

const { sys_common_status } = toRefs<any>(useDict("sys_common_status"))

const { isMobile } = useDevice()

const selectedRows = ref<SpelForm[]>([])

const handleSelectionChange = (val: SpelForm[]) => (selectedRows.value = val)
</script>

<template>
  <el-card v-loading="loading" shadow="never">
    <div class="toolbar-wrapper">
      <div :style="isMobile ? 'display:flex; gap: 10px; flex-wrap: wrap;' : ''">
        <el-button
          type="primary"
          :icon="CirclePlus"
          v-hasPermi="['workflow:spel:add']"
          @click="openAddDialog()"
        >
          新增
        </el-button>
        <el-button
          type="danger" plain icon="Delete"
          :disabled="!selectedRows.length"
          v-hasPermi="['workflow:spel:remove']"
          @click="handleDelete(selectedRows)"
        >
          批量删除
        </el-button>
      </div>
      <div>
        <el-tooltip content="刷新当前页">
          <el-button type="primary" :icon="RefreshRight" circle @click="() => getTableData()" />
        </el-tooltip>
      </div>
    </div>
    <div class="table-wrapper">
      <el-table :data="tableData" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="组件名称" align="center">
          <template #default="scope">
            {{ scope.row.componentName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="方法名称" align="center">
          <template #default="scope">
            {{ scope.row.methodName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="参数名称" align="center">
          <template #default="scope">
            {{ scope.row.methodParams || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="SPEL表达式" align="center" prop="viewSpel" />

        <el-table-column prop="status" label="状态" align="center">
          <template #default="scope">
            <DictTag :options="sys_common_status" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="备注" align="center">
          <template #default="scope">
            {{ scope.row.remark || '-' }}
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" :width="isMobile ? 100 : 130" align="center">
          <template #default="scope">
            <slot name="operation" :scope="scope" />
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="pager-wrapper">
      <el-pagination
        background
        :layout="paginationData.layout"
        :page-sizes="paginationData.pageSizes"
        :total="paginationData.total"
        :page-size="paginationData.pageSize"
        :current-page="paginationData.currentPage"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </el-card>
</template>

<style lang="scss" scoped>
.toolbar-wrapper {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.table-wrapper {
  margin-bottom: 20px;
}

.pager-wrapper {
  display: flex;
  justify-content: flex-end;
}
</style>
