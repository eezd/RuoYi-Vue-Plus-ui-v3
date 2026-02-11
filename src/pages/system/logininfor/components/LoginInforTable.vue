<script lang="ts" setup>
import type { LoginInfoVO } from "@@/apis/admin/monitor/loginInfo/types.ts"
import type { PaginationData } from "@@/composables/usePagination.ts"
import { cleanSysLoginInfoApi, unlockSysLoginInfoApi } from "@@/apis/admin/monitor/loginInfo"
import DictTag from "@@/components/DictTag/index.vue"
import { useDevice } from "@@/composables/useDevice.ts"
import { useDict } from "@@/composables/useDict.ts"
import { formatDateTime } from "@@/utils"
import { checkPermission } from "@@/utils/permission"
import { RefreshRight } from "@element-plus/icons-vue"
import { ref } from "vue"

const emit = defineEmits<EmitEvents>()
/**
 * defineModel
 */
// #region defineModel
const tableData = defineModel<LoginInfoVO[]>("tableData", { required: true })
const paginationData = defineModel<PaginationData>("paginationData", { required: true })
const loading = defineModel<boolean>("loading", { required: true })
// #endregion

/**
 * EmitEvents
 */
// #region EmitEvents
export interface EmitEvents {
  handleDelete: [rows: LoginInfoVO[]]
  handleExport: []
  handleSizeChange: [val: number]
  handleCurrentChange: [val: number]
  getTableData: []
}
const handleDelete = (rows: LoginInfoVO[]) => emit("handleDelete", rows)
const handleExport = () => emit("handleExport")
const handleSizeChange = (val: number) => emit("handleSizeChange", val)
const handleCurrentChange = (val: number) => emit("handleCurrentChange", val)
const getTableData = () => emit("getTableData")
// #endregion

const { sys_device_type, sys_common_status } = toRefs<any>(useDict("sys_device_type", "sys_common_status"))

const { isMobile } = useDevice()

const selectedRows = ref<LoginInfoVO[]>([])

const handleSelectionChange = (val: LoginInfoVO[]) => (selectedRows.value = val)

async function handleClean() {
  try {
    await ElMessageBox.confirm("是否确认清空所有登录日志数据项", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
  } catch {
    return
  }
  await cleanSysLoginInfoApi()
  await getTableData()
  ElMessage.success("删除成功")
}

async function handleUnlock() {
  const username = selectedRows.value.map(item => item.userName)
  if (username.length !== 1) return
  await ElMessageBox.confirm(`是否确认解锁用户"${username}"数据项?`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
  await unlockSysLoginInfoApi(username)
  ElMessage.success(`用户${username}解锁成功`)
}
</script>

<template>
  <el-card v-loading="loading" shadow="never">
    <div class="toolbar-wrapper">
      <div :style="isMobile ? 'display:flex; gap: 10px; flex-wrap: wrap;' : ''">
        <el-button
          type="danger" plain icon="Delete"
          :disabled="!selectedRows.length || !checkPermission(['system:logininfor:remove'])"
          @click="handleDelete(selectedRows)"
        >
          批量删除
        </el-button>
        <el-button
          type="danger" plain icon="WarnTriangleFilled"
          :disabled="!checkPermission(['system:logininfor:remove'])"
          @click="handleClean()"
        >
          清空
        </el-button>
        <el-button type="primary" plain icon="Unlock" :disabled="selectedRows.length !== 1 || !checkPermission(['system:logininfor:unlock'])" @click="handleUnlock()">
          解锁
        </el-button>
        <el-button
          type="warning" plain icon="Download"
          :disabled="!checkPermission(['system:logininfor:export'])"
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
        <el-table-column prop="infoId" label="访问编号" align="center" />
        <el-table-column
          prop="userName"
          label="用户名称"
          align="center"
          :show-overflow-tooltip="true"
          sortable="custom"
          :sort-orders="['descending', 'ascending']"
        />
        <el-table-column prop="clientKey" label="客户端" align="center" />
        <el-table-column prop="businessType" label="设备类型" align="center">
          <template #default="scope">
            <DictTag :options="sys_device_type" :value="scope.row.deviceType" />
          </template>
        </el-table-column>
        <el-table-column prop="ipaddr" label="地址" align="center" />
        <el-table-column prop="loginLocation" label="登录地点" align="center" />
        <el-table-column prop="os" label="操作系统" align="center" />
        <el-table-column prop="browser" label="浏览器" align="center" />

        <el-table-column prop="status" label="登录状态" align="center">
          <template #default="scope">
            <DictTag :options="sys_common_status" :value="scope.row.status" />
          </template>
        </el-table-column>

        <el-table-column prop="msg" label="描述" align="center" />

        <el-table-column label="访问时间" align="center" prop="loginTime" width="180" sortable="custom" :sort-orders="['descending', 'ascending']">
          <template #default="scope">
            <span>{{ formatDateTime(scope.row.loginTime) }}</span>
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
