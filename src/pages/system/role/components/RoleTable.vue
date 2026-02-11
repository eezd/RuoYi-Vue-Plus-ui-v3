<script lang="ts" setup>
import type { RoleForm } from "@@/apis/admin/system/role/types.ts"
import type { PaginationData } from "@@/composables/usePagination.ts"
import { changeSysRoleStatusApi } from "@@/apis/admin/system/role"
import { useDevice } from "@@/composables/useDevice.ts"
import { formatDateTime } from "@@/utils"
import { checkPermission } from "@@/utils/permission"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { ref } from "vue"

const emit = defineEmits<EmitEvents>()
/**
 * defineModel
 */
// #region defineModel
const tableData = defineModel<RoleForm[]>("tableData", { required: true })
const paginationData = defineModel<PaginationData>("paginationData", { required: true })
const loading = defineModel<boolean>("loading", { required: true })
// #endregion

/**
 * EmitEvents
 */
// #region EmitEvents
export interface EmitEvents {
  openAddDialog: []
  handleDelete: [rows: RoleForm[]]
  handleExport: []
  handleSizeChange: [val: number]
  handleCurrentChange: [val: number]
  getTableData: []
}
const openAddDialog = () => emit("openAddDialog")
const handleDelete = (rows: RoleForm[]) => emit("handleDelete", rows)
const handleExport = () => emit("handleExport")
const handleSizeChange = (val: number) => emit("handleSizeChange", val)
const handleCurrentChange = (val: number) => emit("handleCurrentChange", val)
const getTableData = () => emit("getTableData")
// #endregion

const { isMobile } = useDevice()

const selectedRows = ref<RoleForm[]>([])

const handleSelectionChange = (val: RoleForm[]) => (selectedRows.value = val)

async function handleStatusChange(row: RoleForm) {
  const text = row.status === "0" ? "启用" : "停用"
  try {
    await ElMessageBox.confirm(`确认要"${text}""${row.roleName}"角色吗?`, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
    await changeSysRoleStatusApi(row.roleId, row.status)
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
          :disabled="!checkPermission(['system:role:add'])"
          @click="openAddDialog()"
        >
          新增
        </el-button>
        <el-button
          type="danger" plain icon="Delete"
          :disabled="!selectedRows.length || !checkPermission(['system:role:remove'])"
          @click="handleDelete(selectedRows)"
        >
          批量删除
        </el-button>
        <el-button
          type="warning" plain icon="Download"
          :disabled="!checkPermission(['system:role:export'])"
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
        <el-table-column prop="roleName" label="角色名称" align="center" />
        <el-table-column prop="roleKey" label="权限字符" align="center" />
        <el-table-column prop="roleSort" label="显示顺序" align="center" />
        <el-table-column prop="status" label="状态" align="center">
          <template #default="scope">
            <el-switch v-model="scope.row.status" active-value="0" inactive-value="1" :disabled="!checkPermission(['system:role:edit'])" @change="handleStatusChange(scope.row)" />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" min-width="180">
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
