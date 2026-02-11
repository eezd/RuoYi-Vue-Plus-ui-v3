<script lang="ts" setup>
import type { PaginationData } from "@@/composables/usePagination.ts"
import type { OssConfigForm, OssConfigVO } from "@/common/apis/admin/system/ossConfig/types"
import { useDevice } from "@@/composables/useDevice.ts"
import { checkPermission } from "@@/utils/permission"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { ref } from "vue"
import { changeSysOssConfigStatusApi } from "@/common/apis/admin/system/ossConfig"

const emit = defineEmits<EmitEvents>()
/**
 * defineModel
 */
// #region defineModel
const tableData = defineModel<OssConfigForm[]>("tableData", { required: true })
const paginationData = defineModel<PaginationData>("paginationData", { required: true })
const loading = defineModel<boolean>("loading", { required: true })
// #endregion

/**
 * EmitEvents
 */
// #region EmitEvents
export interface EmitEvents {
  openAddDialog: []
  handleDelete: [rows: OssConfigForm[]]
  handleSizeChange: [val: number]
  handleCurrentChange: [val: number]
  getTableData: []
}
const openAddDialog = () => emit("openAddDialog")
const handleDelete = (rows: OssConfigForm[]) => emit("handleDelete", rows)
const handleSizeChange = (val: number) => emit("handleSizeChange", val)
const handleCurrentChange = (val: number) => emit("handleCurrentChange", val)
const getTableData = () => emit("getTableData")
// #endregion

const { isMobile } = useDevice()

const selectedRows = ref<OssConfigForm[]>([])

const handleSelectionChange = (val: OssConfigForm[]) => (selectedRows.value = val)

async function handleStatusChange(row: OssConfigVO) {
  const text = row.status === "0" ? "启用" : "停用"
  try {
    await ElMessageBox.confirm(`确认要"${text}"吗?`, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
    loading.value = true
    await changeSysOssConfigStatusApi(row.ossConfigId, row.status, row.configKey)
    await getTableData()
    loading.value = false
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
          :disabled="!checkPermission(['system:dict:add'])"
          @click="openAddDialog()"
        >
          新增
        </el-button>
        <el-button
          type="danger" plain icon="Delete"
          :disabled="!selectedRows.length || !checkPermission(['system:dict:remove'])"
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
        <el-table-column prop="configKey" label="配置key" align="center" />
        <el-table-column prop="endpoint" label="访问站点" align="center" />
        <el-table-column prop="domain" label="自定义域名" align="center" />
        <el-table-column prop="bucketName" label="桶名称" align="center" />
        <el-table-column prop="prefix" label="前缀" align="center" />
        <el-table-column prop="region" label="域" align="center" />
        <el-table-column prop="accessPolicy" label="桶权限类型" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.accessPolicy === '0'" type="warning">
              private
            </el-tag>
            <el-tag v-if="scope.row.accessPolicy === '1'" type="success">
              public
            </el-tag>
            <el-tag v-if="scope.row.accessPolicy === '2'" type="info">
              custom
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" align="center">
          <template #default="scope">
            <el-switch v-model="scope.row.status" active-value="0" inactive-value="1" @change="handleStatusChange(scope.row)" />
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
