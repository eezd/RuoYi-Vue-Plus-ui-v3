<script lang="ts" setup>
import type { ClientForm, ClientVO } from "@@/apis/admin/system/client/types.ts"
import type { PaginationData } from "@@/composables/usePagination.ts"
import { changeSysStatusApi } from "@@/apis/admin/system/client"
import DictTag from "@@/components/DictTag/index.vue"
import { useDevice } from "@@/composables/useDevice.ts"
import { useDict } from "@@/composables/useDict.ts"
import { checkPermission } from "@@/utils/permission"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { ref } from "vue"

const emit = defineEmits<EmitEvents>()
/**
 * defineModel
 */
// #region defineModel
const tableData = defineModel<ClientForm[]>("tableData", { required: true })
const paginationData = defineModel<PaginationData>("paginationData", { required: true })
const loading = defineModel<boolean>("loading", { required: true })
// #endregion

/**
 * EmitEvents
 */
// #region EmitEvents
export interface EmitEvents {
  openAddDialog: []
  handleDelete: [rows: ClientForm[]]
  handleExport: []
  handleSizeChange: [val: number]
  handleCurrentChange: [val: number]
  getTableData: []
}
const openAddDialog = () => emit("openAddDialog")
const handleDelete = (rows: ClientForm[]) => emit("handleDelete", rows)
const handleExport = () => emit("handleExport")
const handleSizeChange = (val: number) => emit("handleSizeChange", val)
const handleCurrentChange = (val: number) => emit("handleCurrentChange", val)
const getTableData = () => emit("getTableData")
// #endregion

const { sys_grant_type, sys_device_type } = toRefs<any>(useDict("sys_grant_type", "sys_device_type"))

const { isMobile } = useDevice()

const selectedRows = ref<ClientForm[]>([])

const handleSelectionChange = (val: ClientForm[]) => (selectedRows.value = val)

async function handleStatusChange(row: ClientVO) {
  const text = row.status === "0" ? "启用" : "停用"
  try {
    await ElMessageBox.confirm(`确认要"${text}"吗?`, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
    await changeSysStatusApi(row.clientId, row.status)
    ElMessage.success(`${text}成功`)
  } catch {
    row.status = row.status === "0" ? "1" : "0"
  }
}
</script>

<template>
  <el-card v-loading="loading" shadow="never">
    <div class="toolbar-wrapper">
      <div :style="isMobile ? 'display:flex; gap: 10px; flex-wrap: wrap;' : ''">
        <el-button
          type="primary"
          :icon="CirclePlus"
          :disabled="!checkPermission(['system:client:add'])"
          @click="openAddDialog()"
        >
          新增
        </el-button>
        <el-button
          type="danger" plain icon="Delete"
          :disabled="!selectedRows.length || !checkPermission(['system:client:remove'])"
          @click="handleDelete(selectedRows)"
        >
          批量删除
        </el-button>
        <el-button
          type="warning" plain icon="Download"
          :disabled="!checkPermission(['system:client:export'])"
          @click="handleExport()"
        >
          导出
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
        <el-table-column prop="clientId" label="客户端id" align="center" />
        <el-table-column prop="clientKey" label="客户端key" align="center" />
        <el-table-column prop="clientSecret" label="客户端秘钥" align="center" />
        <el-table-column prop="grantTypeList" label="授权类型" align="center">
          <template #default="scope">
            <DictTag :options="sys_grant_type" :value="scope.row.grantTypeList" />
          </template>
        </el-table-column>
        <el-table-column prop="deviceType" label="设备类型" align="center">
          <template #default="scope">
            <DictTag :options="sys_device_type" :value="scope.row.deviceType" />
          </template>
        </el-table-column>
        <el-table-column prop="activeTimeout" label="Token活跃超时时间" align="center" :show-overflow-tooltip="true" />
        <el-table-column prop="timeout" label="Token固定超时时间" align="center" :show-overflow-tooltip="true" />
        <el-table-column prop="status" label="状态" align="center">
          <template #default="scope">
            <el-switch v-model="scope.row.status" active-value="0" inactive-value="1" :disabled="!checkPermission(['system:client:edit'])" @change="handleStatusChange(scope.row)" />
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
