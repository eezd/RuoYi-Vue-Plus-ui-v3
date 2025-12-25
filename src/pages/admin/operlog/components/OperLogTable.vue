<script lang="ts" setup>
import type { PaginationData } from "@@/composables/usePagination"
import type { OperLogForm, OperLogVO } from "@/common/apis/admin/monitor/operlog/types"
import DictTag from "@@/components/DictTag/index.vue"
import { useDevice } from "@@/composables/useDevice"
import { formatDateTime } from "@@/utils/index"
import { RefreshRight } from "@element-plus/icons-vue"
import { ref } from "vue"
import { cleanSysOperlogApi } from "@/common/apis/admin/monitor/operlog"
import { useDict } from "@/common/composables/useDict"

const emit = defineEmits<EmitEvents>()
/**
 * defineModel
 */
// #region defineModel
const tableData = defineModel<OperLogVO[]>("tableData", { required: true })
const paginationData = defineModel<PaginationData>("paginationData", { required: true })
const loading = defineModel<boolean>("loading", { required: true })
// #endregion

/**
 * EmitEvents
 */
// #region EmitEvents
export interface EmitEvents {
  handleDelete: [rows: OperLogForm[]]
  handleExport: []
  handleSizeChange: [val: number]
  handleCurrentChange: [val: number]
  getTableData: []
}
const handleDelete = (rows: OperLogForm[]) => emit("handleDelete", rows)
const handleExport = () => emit("handleExport")
const handleSizeChange = (val: number) => emit("handleSizeChange", val)
const handleCurrentChange = (val: number) => emit("handleCurrentChange", val)
const getTableData = () => emit("getTableData")
// #endregion

const { sys_oper_type, sys_common_status } = toRefs<any>(useDict("sys_oper_type", "sys_common_status"))

const { isMobile } = useDevice()

const selectedRows = ref<OperLogForm[]>([])

const handleSelectionChange = (val: OperLogForm[]) => (selectedRows.value = val)

async function handleClean() {
  await ElMessageBox.confirm("是否确认清空所有操作日志数据项", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
  await cleanSysOperlogApi()
  await getTableData()
  ElMessage.success("删除成功")
}
</script>

<template>
  <el-card v-loading="loading" shadow="never">
    <div class="toolbar-wrapper">
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
    </div>
    <div class="table-wrapper">
      <el-table :data="tableData" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column prop="operId" label="日志编号" align="center" />
        <el-table-column prop="title" label="系统模块" align="center" />
        <el-table-column prop="businessType" label="操作类型" align="center">
          <template #default="scope">
            <DictTag :options="sys_oper_type" :value="scope.row.businessType" />
          </template>
        </el-table-column>
        <el-table-column
          prop="operName"
          label="操作人员"
          align="center"
          width="110"
          :show-overflow-tooltip="true"
          sortable="custom"
          :sort-orders="['descending', 'ascending']"
        />
        <el-table-column prop="operIp" label="操作地址" align="center" />
        <el-table-column prop="status" label="状态" align="center">
          <template #default="scope">
            <DictTag :options="sys_common_status" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="操作日期" align="center" prop="operTime" width="180">
          <template #default="scope">
            <span>{{ formatDateTime(scope.row.operTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="costTime"
          label="消耗时间"
          align="center"
          width="110"
          :show-overflow-tooltip="true"
          sortable="custom"
          :sort-orders="['descending', 'ascending']"
        >
          <template #default="scope">
            <span>{{ scope.row.costTime }}毫秒</span>
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
