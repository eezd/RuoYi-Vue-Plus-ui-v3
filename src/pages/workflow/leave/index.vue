<script lang="ts" setup>
import type { LeaveQuery, LeaveVO } from "@/common/apis/workflow/leave/types"
import DictTag from "@@/components/DictTag/index.vue"
import { usePagination } from "@@/composables/usePagination.ts"
import { formatDateTime } from "@@/utils"
import { Delete, Download, Edit, Plus, Refresh, RefreshRight, Search, View } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { cancelWorkflowProcessApplyApi } from "@/common/apis/workflow/instance"
import { delWorkflowLeaveApi, getWorkflowLeaveListApi } from "@/common/apis/workflow/leave"
import { useDict } from "@/common/composables/useDict"
import { download } from "@/http/download"

defineOptions({
  name: "AdminWorkflowLeave"
})

const router = useRouter()
const { wf_business_status } = toRefs<any>(useDict("wf_business_status"))

const loading = ref(false)
const tableData = ref<LeaveVO[]>([])
const selectedRows = ref<LeaveVO[]>([])
const showSearch = ref(true)

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const searchData = reactive({
  startLeaveDays: undefined,
  endLeaveDays: undefined
} as LeaveQuery)
const searchFormRef = useTemplateRef("searchFormRef")

const leaveTypeOptions = [
  { label: "事假", value: "1" },
  { label: "调休", value: "2" },
  { label: "病假", value: "3" },
  { label: "婚假", value: "4" }
]

const editableStatusList = ["draft", "cancel", "back"]

function getLeaveTypeLabel(value: string) {
  return leaveTypeOptions.find(item => item.value === value)?.label ?? value
}

function isEditableRow(row: LeaveVO) {
  return editableStatusList.includes(row.status)
}

const selectedEditableRows = computed(() => selectedRows.value.filter(isEditableRow))
const hasSelectedRows = computed(() => selectedRows.value.length > 0)
const canBatchDelete = computed(() => selectedEditableRows.value.length > 0)

function handleSelectionChange(rows: LeaveVO[]) {
  selectedRows.value = rows
}

async function getTableData() {
  try {
    loading.value = true
    const { rows, total } = await getWorkflowLeaveListApi({
      ...searchData,
      pageNum: paginationData.currentPage,
      pageSize: paginationData.pageSize
    })
    tableData.value = rows
    paginationData.total = total
  } catch {
    tableData.value = []
  } finally {
    loading.value = false
  }
}

function handleQuery() {
  paginationData.currentPage = 1
  getTableData()
}

function resetSearch() {
  searchFormRef.value?.resetFields()
  handleQuery()
}

function handleAdd() {
  router.push({
    path: "/workflow/leave/leave-edit/index",
    query: {
      type: "add"
    }
  })
}

function handleUpdate(row: LeaveVO) {
  router.push({
    path: "/workflow/leave/leave-edit/index",
    query: {
      id: row.id,
      type: "update"
    }
  })
}

function handleView(row: LeaveVO) {
  router.push({
    path: "/workflow/leave/leave-edit/index",
    query: {
      id: row.id,
      type: "view"
    }
  })
}

async function handleDelete(row?: LeaveVO) {
  const items = row ? [row] : selectedEditableRows.value
  if (items.length === 0) {
    ElMessage.warning(hasSelectedRows.value ? "当前选中数据不可删除" : "请选择要删除的数据")
    return
  }

  try {
    await ElMessageBox.confirm(`确认删除选中的 ${items.length} 条请假记录吗？`, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
    loading.value = true
    const ids = items.map(item => item.id)
    const res = await delWorkflowLeaveApi(ids)
    ElMessage.success(res.msg)
    await getTableData()
  } catch {
  } finally {
    loading.value = false
  }
}

function handleExport() {
  const timestamp = new Date().getTime()
  download(
    "/workflow/leave/export",
    { ...searchData },
    `leave_${timestamp}.xlsx`
  )
}

async function handleCancelProcessApply(row: LeaveVO) {
  try {
    await ElMessageBox.confirm("确认撤销当前流程申请吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
    loading.value = true
    const res = await cancelWorkflowProcessApplyApi({
      businessId: row.id,
      message: "申请人撤销流程"
    })
    ElMessage.success(res.msg || "撤销成功")
    await getTableData()
  } catch {
  } finally {
    loading.value = false
  }
}

watch(
  [() => paginationData.currentPage, () => paginationData.pageSize],
  () => {
    getTableData()
  }
)

onMounted(() => {
  getTableData()
})
</script>

<template>
  <div class="app-container workflow-leave-page">
    <el-card v-loading="loading" shadow="never" class="search-wrapper" :class="{ 'is-collapsed': !showSearch }">
      <template #header>
        <div class="panel-heading search-panel-toggle" @click.stop="showSearch = !showSearch">
          <div>
            <h3>筛选条件</h3>
          </div>
        </div>
      </template>
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item label="请假天数" prop="startLeaveDays">
          <el-input v-model="searchData.startLeaveDays" placeholder="开始天数" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="至" prop="endLeaveDays">
          <el-input v-model="searchData.endLeaveDays" placeholder="结束天数" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleQuery">
            查询
          </el-button>
          <el-button :icon="Refresh" @click="resetSearch">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-loading="loading" shadow="never" class="table-panel">
      <div class="toolbar-wrapper">
        <div class="table-heading">
          <h3>请假列表</h3>
        </div>
        <div class="toolbar-left">
          <el-button type="primary" :icon="Plus" v-hasPermi="['workflow:leave:add']" @click="handleAdd">
            新增
          </el-button>
          <el-button
            type="danger"
            plain
            :icon="Delete"
            :disabled="!canBatchDelete"
            v-hasPermi="['workflow:leave:remove']"
            @click="handleDelete()"
          >
            批量删除
          </el-button>
          <el-button
            type="warning"
            plain
            :icon="Download"
            v-hasPermi="['workflow:leave:export']"
            @click="handleExport"
          >
            导出
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-tooltip :content="showSearch ? '隐藏搜索' : '显示搜索'">
            <el-button :type="showSearch ? 'primary' : 'default'" :icon="Search" circle @click="showSearch = !showSearch" />
          </el-tooltip>
        <el-tooltip content="刷新当前页">
          <el-button type="primary" :icon="RefreshRight" circle @click="getTableData" />
        </el-tooltip>
        </div>
      </div>

      <div class="table-wrapper">
        <el-table :data="tableData" border @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column label="请假类型" align="center" min-width="100">
            <template #default="scope">
              <el-tag>{{ getLeaveTypeLabel(scope.row.leaveType) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="开始时间" align="center" min-width="140">
            <template #default="scope">
              <span>{{ formatDateTime(scope.row.startDate) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="结束时间" align="center" min-width="140">
            <template #default="scope">
              <span>{{ formatDateTime(scope.row.endDate) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="leaveDays" label="请假天数" align="center" min-width="90" />
          <el-table-column prop="remark" label="请假原因" align="center" min-width="180" show-overflow-tooltip />
          <el-table-column label="流程状态" align="center" min-width="100">
            <template #default="scope">
              <DictTag :options="wf_business_status" :value="scope.row.status" />
            </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" align="center" width="260">
            <template #default="scope">
              <el-button
                v-if="isEditableRow(scope.row)"
                type="primary"
                :icon="Edit"
                text
                bg
                size="small"
                v-hasPermi="['workflow:leave:edit']"
                @click="handleUpdate(scope.row)"
              >
                修改
              </el-button>
              <el-button
                v-if="isEditableRow(scope.row)"
                type="danger"
                :icon="Delete"
                text
                bg
                size="small"
                v-hasPermi="['workflow:leave:remove']"
                @click="handleDelete(scope.row)"
              >
                删除
              </el-button>
              <el-button type="primary" :icon="View" text bg size="small" @click="handleView(scope.row)">
                查看
              </el-button>
              <el-button
                v-if="scope.row.status === 'waiting'"
                type="warning"
                text
                bg
                size="small"
                @click="handleCancelProcessApply(scope.row)"
              >
                撤销
              </el-button>
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
          v-model:page-size="paginationData.pageSize"
          v-model:current-page="paginationData.currentPage"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.search-wrapper {
  margin-bottom: 20px;
  :deep(.el-card__body) {
    padding-bottom: 2px;
  }
}

.toolbar-wrapper {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toolbar-left {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.search-wrapper.is-collapsed {
  :deep(.el-card__body) {
    display: none;
  }
}

.table-wrapper {
  margin-bottom: 20px;
}

.pager-wrapper {
  display: flex;
  justify-content: flex-end;
}
</style>
