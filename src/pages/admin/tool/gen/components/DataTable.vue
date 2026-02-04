<script lang="ts" setup>
import type { PaginationData } from "@@/composables/usePagination.ts"
import type { TableVO } from "@/common/apis/admin/tool/gen/types"
import { useDevice } from "@@/composables/useDevice.ts"
import { formatDateTime } from "@@/utils"
import { checkPermission } from "@@/utils/permission"
import { CirclePlus, Edit, RefreshRight } from "@element-plus/icons-vue"
import { ref } from "vue"

const emit = defineEmits<EmitEvents>()
/**
 * defineModel
 */
// #region defineModel
const tableData = defineModel<TableVO[]>("tableData", { required: true })
const paginationData = defineModel<PaginationData>("paginationData", { required: true })
const loading = defineModel<boolean>("loading", { required: true })
// #endregion

/**
 * EmitEvents
 */
// #region EmitEvents
export interface EmitEvents {
  openImportDialog: []
  handleDelete: [rows: TableVO[]]
  handleUpdate: [row: TableVO]
  handleSizeChange: [val: number]
  handleCurrentChange: [val: number]
  getTableData: []
}
const openImportDialog = () => emit("openImportDialog")
const handleDelete = (rows: TableVO[]) => emit("handleDelete", rows)
const handleUpdate = (row: TableVO) => emit("handleUpdate", row)
const handleSizeChange = (val: number) => emit("handleSizeChange", val)
const handleCurrentChange = (val: number) => emit("handleCurrentChange", val)
const getTableData = () => emit("getTableData")
// #endregion

const { isMobile } = useDevice()

const selectedRows = ref<TableVO[]>([])

const handleSelectionChange = (val: TableVO[]) => (selectedRows.value = val)
</script>

<template>
  <el-card v-loading="loading" shadow="never">
    <div class="toolbar-wrapper">
      <div :style="isMobile ? 'display:flex; gap: 10px; flex-wrap: wrap;' : ''">
        <el-button
          type="info"
          :icon="CirclePlus"
          :disabled="!checkPermission(['tool:gen:code'])"
          @click="openImportDialog()"
        >
          生成
        </el-button>
        <el-button
          type="primary"
          :icon="CirclePlus"
          :disabled="!checkPermission(['tool:gen:import'])"
          @click="openImportDialog()"
        >
          导入
        </el-button>
        <el-button
          type="success"
          :icon="Edit"
          :disabled="!checkPermission(['tool:gen:edit']) || !selectedRows.length || selectedRows.length > 1"
          @click="handleUpdate(selectedRows[0])"
        >
          编辑
        </el-button>
        <el-button
          type="danger" plain icon="Delete"
          :disabled="!selectedRows.length || !checkPermission(['tool:gen:remove'])"
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
        <el-table-column label="数据源" align="center" prop="dataName" :show-overflow-tooltip="true" />
        <el-table-column label="表名称" align="center" prop="tableName" :show-overflow-tooltip="true" />
        <el-table-column label="表描述" align="center" prop="tableComment" :show-overflow-tooltip="true" />
        <el-table-column label="实体" align="center" prop="className" :show-overflow-tooltip="true" />
        <el-table-column label="更新时间" align="center" prop="updateTime" width="180">
          <template #default="scope">
            <span>{{ formatDateTime(scope.row.updateTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="180">
          <template #default="scope">
            <span>{{ formatDateTime(scope.row.createTime) }}</span>
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
