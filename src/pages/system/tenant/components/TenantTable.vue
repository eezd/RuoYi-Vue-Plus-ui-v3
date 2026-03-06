<script lang="ts" setup>
import type { PaginationData } from "@@/composables/usePagination.ts"
import type { TenantForm, TenantVO } from "@/common/apis/system/tenant/types"
import { useDevice } from "@@/composables/useDevice.ts"
import { formatDateTime } from "@@/utils"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { ref } from "vue"
import { syncSysTenantConfigApi, syncSysTenantDictApi } from "@/common/apis/system/tenant"
import { useUserStore } from "@/pinia/stores/user"

const emit = defineEmits<EmitEvents>()
/**
 * defineModel
 */
// #region defineModel
const tableData = defineModel<TenantVO[]>("tableData", { required: true })
const paginationData = defineModel<PaginationData>("paginationData", { required: true })
const loading = defineModel<boolean>("loading", { required: true })
// #endregion

/**
 * EmitEvents
 */
// #region EmitEvents
export interface EmitEvents {
  openAddDialog: []
  handleDelete: [rows: TenantForm[]]
  handleExport: []
  handleSizeChange: [val: number]
  handleCurrentChange: [val: number]
  getTableData: []
}
const openAddDialog = () => emit("openAddDialog")
const handleDelete = (rows: TenantForm[]) => emit("handleDelete", rows)
const handleExport = () => emit("handleExport")
const handleSizeChange = (val: number) => emit("handleSizeChange", val)
const handleCurrentChange = (val: number) => emit("handleCurrentChange", val)
const getTableData = () => emit("getTableData")
// #endregion

const { isMobile } = useDevice()
const userStore = useUserStore()
const userId = ref(userStore.userId)

const selectedRows = ref<TenantForm[]>([])

const handleSelectionChange = (val: TenantForm[]) => (selectedRows.value = val)

/** 同步租户字典 */
async function handleSyncTenantDict() {
  await ElMessageBox.confirm("确认要同步所有租户字典吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
  const res = await syncSysTenantDictApi()
  ElMessage.success(res.msg)
}

/** 同步租户参数配置 */
async function handleSyncTenantConfig() {
  await ElMessageBox.confirm("确认要同步所有租户参数配置吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
  const res = await syncSysTenantConfigApi()
  ElMessage.success(res.msg)
}
</script>

<template>
  <el-card v-loading="loading" shadow="never">
    <div class="toolbar-wrapper">
      <div :style="isMobile ? 'display:flex; gap: 10px; flex-wrap: wrap;' : ''">
        <el-button
          type="primary"
          :icon="CirclePlus"
          v-hasPermi="['system:tenant:add']"
          @click="openAddDialog()"
        >
          新增
        </el-button>
        <el-button
          type="danger" plain icon="Delete"
          :disabled="!selectedRows.length"
          v-hasPermi="['system:tenant:remove']"
          @click="handleDelete(selectedRows)"
        >
          批量删除
        </el-button>
        <el-button
          type="warning" plain icon="Download"
          v-hasPermi="['system:tenant:export']"
          @click="handleExport()"
        >
          导出
        </el-button>
        <el-button
          v-if="userId === 1"
          type="success" plain icon="Download"
          @click="handleSyncTenantDict()"
        >
          同步租户字典
        </el-button>
        <el-button
          v-if="userId === 1"
          type="success" plain icon="Download"
          @click="handleSyncTenantConfig()"
        >
          同步租户参数配置
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
        <el-table-column prop="tenantId" label="租户编号" align="center" />
        <el-table-column prop="contactUserName" label="联系人" align="center" />
        <el-table-column prop="contactPhone" label="联系电话" align="center" />
        <el-table-column prop="companyName" label="企业名称" align="center" />
        <el-table-column prop="licenseNumber" label="社会信用代码" align="center" />
        <el-table-column prop="companyName" label="企业名称" align="center" />
        <el-table-column prop="expireTime" label="过期时间" align="center">
          <template #default="scope">
            <span>{{ formatDateTime(scope.row.expireTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" align="center" :show-overflow-tooltip="true" />
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
