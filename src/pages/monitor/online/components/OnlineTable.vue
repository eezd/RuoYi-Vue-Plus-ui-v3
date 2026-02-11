<script lang="ts" setup>
import type { OnlineVO } from "@@/apis/monitor/online/types"
import type { PaginationData } from "@@/composables/usePagination.ts"
import DictTag from "@@/components/DictTag/index.vue"
import { useDevice } from "@@/composables/useDevice.ts"
import { useDict } from "@@/composables/useDict.ts"
import { DEFAULT_PAGINATION_DATA } from "@@/composables/usePagination.ts"
import { formatDateTime } from "@@/utils"

const emit = defineEmits<EmitEvents>()
/**
 * defineModel
 */
// #region defineModel
const tableData = defineModel<OnlineVO[]>("tableData", { required: true })
const paginationData = defineModel<PaginationData>("paginationData", { required: true })
const loading = defineModel<boolean>("loading", { required: true })
// #endregion

/**
 * EmitEvents
 */
// #region EmitEvents
export interface EmitEvents {
  handleExport: []
  handleSizeChange: [val: number]
  handleCurrentChange: [val: number]
  getTableData: []
}
const handleSizeChange = (val: number) => emit("handleSizeChange", val)
const handleCurrentChange = (val: number) => emit("handleCurrentChange", val)
// #endregion

const { sys_device_type } = toRefs<any>(useDict("sys_device_type"))

const { isMobile } = useDevice()

const pageBaseNum = computed(() =>
  ((paginationData.value?.currentPage ?? DEFAULT_PAGINATION_DATA.currentPage) - 1) * (paginationData.value?.pageSize ?? DEFAULT_PAGINATION_DATA.pageSize)
)
</script>

<template>
  <el-card v-loading="loading" shadow="never">
    <!-- <div class="toolbar-wrapper">
      <div :style="isMobile ? 'display:flex; gap: 10px; flex-wrap: wrap;' : ''">
        <el-button
          type="danger" plain icon="Delete"
          :disabled="!selectedRows.length"
          @click="handleDelete(selectedRows)"
        >
          批量删除
        </el-button>
        <el-button
          type="danger" plain icon="WarnTriangleFilled"
          @click="handleClean()"
        >
          清空
        </el-button>
        <el-button type="primary" plain icon="Unlock" :disabled="selectedRows.length !== 1" @click="handleUnlock()">
          解锁
        </el-button>
        <el-button
          type="warning" plain icon="Download"
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
    </div> -->
    <div class="table-wrapper">
      <el-table :data="tableData">
        <el-table-column label="序号" width="80" type="index" align="center">
          <template #default="scope">
            <span>{{ pageBaseNum + scope.$index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="tokenId" label="会话编号" align="center" :show-overflow-tooltip="true" />
        <el-table-column prop="userName" label="登录名称" align="center" />
        <el-table-column prop="clientKey" label="客户端" align="center" />
        <el-table-column label="设备类型" align="center">
          <template #default="scope">
            <DictTag :options="sys_device_type" :value="scope.row.deviceType" />
          </template>
        </el-table-column>
        <el-table-column prop="ipaddr" label="主机" align="center" />
        <el-table-column prop="loginLocation" label="登录地点" align="center" />
        <el-table-column prop="os" label="操作系统" align="center" />
        <el-table-column prop="browser" label="浏览器" align="center" />
        <el-table-column label="登录时间" align="center" prop="loginTime" width="180">
          <template #default="scope">
            <span>{{ formatDateTime(scope.row.loginTime) }}</span>
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
