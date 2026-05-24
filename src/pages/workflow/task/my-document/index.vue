<script lang="ts" setup>
import type { CategoryTreeVO } from "@/common/apis/workflow/category/types"
import type { FlowInstanceQuery, FlowInstanceVO } from "@/common/apis/workflow/instance/types"
import DictTag from "@@/components/DictTag/index.vue"
import { usePagination } from "@@/composables/usePagination.ts"
import { Delete, Edit, Refresh, RefreshRight, Search, View } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { getWorkflowCategoryTreeApi } from "@/common/apis/workflow/category"
import {
  cancelWorkflowProcessApplyApi,
  deleteWorkflowInstanceByIdsApi,
  getWorkflowInstanceCurrentPageApi
} from "@/common/apis/workflow/instance"
import { useDict } from "@/common/composables/useDict"
import { routerJumpWorkflowForm } from "@/common/apis/workflow/workflow-common"

defineOptions({
  name: "AdminWorkflowMyDocument"
})

const router = useRouter()
const { wf_business_status } = toRefs<any>(useDict("wf_business_status"))
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const loading = ref(false)
const tableData = ref<FlowInstanceVO[]>([])
const selectedRows = ref<FlowInstanceVO[]>([])

const searchData = reactive({
  flowCode: undefined,
  category: undefined
} as FlowInstanceQuery)
const searchFormRef = useTemplateRef("searchFormRef")

const categoryName = ref("")
const treeOptions = ref<CategoryTreeVO[]>([])
const treeRef = useTemplateRef("treeRef")

const editableStatusList = ["draft", "cancel", "back"]
const cancellableStatusList = ["waiting"]

const selectedEditableRows = computed(() => selectedRows.value.filter(isEditableRow))
const canBatchDelete = computed(() => selectedRows.value.length > 0 && selectedEditableRows.value.length === selectedRows.value.length)

function isEditableRow(row: FlowInstanceVO) {
  return editableStatusList.includes(row.flowStatus)
}

function canCancelRow(row: FlowInstanceVO) {
  return cancellableStatusList.includes(row.flowStatus)
}

function handleSelectionChange(rows: FlowInstanceVO[]) {
  selectedRows.value = rows
}

function handleNodeClick(data: CategoryTreeVO) {
  const nodeId = String(data.id)
  searchData.category = nodeId === "ALL" || nodeId === "0" ? undefined : nodeId
  handleQuery()
}

function filterNode(value: string, data: any) {
  if (!value) return true
  return data.label.includes(value)
}

watchEffect(
  () => {
    treeRef.value?.filter(categoryName.value)
  },
  { flush: "post" }
)

function resetSearch() {
  searchFormRef.value?.resetFields()
  searchData.category = undefined
  handleQuery()
}

function handleQuery() {
  paginationData.currentPage = 1
  getTableData()
}

async function getCategoryTree() {
  const res = await getWorkflowCategoryTreeApi()
  treeOptions.value = res.data
}

async function getTableData() {
  try {
    loading.value = true
    const { rows, total } = await getWorkflowInstanceCurrentPageApi({
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

function handleOpen(row: FlowInstanceVO, type: "update" | "view") {
  routerJumpWorkflowForm(router, {
    businessId: row.businessId,
    taskId: row.id,
    type,
    formCustom: row.formCustom,
    formPath: row.formPath
  })
}

async function handleDelete(row?: FlowInstanceVO) {
  const rows = row ? [row] : selectedRows.value
  if (rows.length === 0) {
    ElMessage.warning("请选择要删除的数据")
    return
  }
  if (rows.some(item => !isEditableRow(item))) {
    ElMessage.warning("只能删除草稿、已撤销或被退回的单据")
    return
  }
  await ElMessageBox.confirm(`确认删除选中的 ${rows.length} 条记录吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
  loading.value = true
  try {
    const ids = rows.map(item => item.id)
    await deleteWorkflowInstanceByIdsApi(ids)
    ElMessage.success("删除成功")
    await getTableData()
  } finally {
    loading.value = false
  }
}

async function handleCancelProcessApply(row: FlowInstanceVO) {
  if (!canCancelRow(row)) {
    ElMessage.warning("只能撤销进行中的单据")
    return
  }
  await ElMessageBox.confirm("确认撤销当前单据流程吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
  loading.value = true
  try {
    await cancelWorkflowProcessApplyApi({
      businessId: row.businessId,
      message: "申请人撤销流程"
    })
    ElMessage.success("撤销成功")
    await getTableData()
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

onActivated(async () => {
  await getTableData()
})

onMounted(async () => {
  await getCategoryTree()
  await getTableData()
})
</script>

<template>
  <div class="app-container">
    <el-row :gutter="20">
      <el-col :lg="4" :xs="24">
        <el-card shadow="hover">
          <el-input v-model="categoryName" placeholder="请输入流程分类名称" prefix-icon="Search" clearable />
          <el-tree
            ref="treeRef"
            class="mt-2"
            node-key="id"
            :data="treeOptions"
            :props="{ label: 'label', children: 'children' }"
            :expand-on-click-node="false"
            :filter-node-method="filterNode"
            highlight-current
            default-expand-all
            @node-click="handleNodeClick"
          />
        </el-card>
      </el-col>

      <el-col :lg="20" :xs="24">
        <el-card v-loading="loading" shadow="never" class="search-wrapper">
          <el-form ref="searchFormRef" :inline="true" :model="searchData">
            <el-form-item label="流程定义编码" prop="flowCode">
              <el-input v-model="searchData.flowCode" placeholder="请输入流程定义编码" @keyup.enter="handleQuery" />
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

        <el-card v-loading="loading" shadow="never">
          <div class="toolbar-wrapper">
            <div class="toolbar-left">
              <el-button type="danger" plain :icon="Delete" :disabled="!canBatchDelete" @click="handleDelete()">
                删除
              </el-button>
            </div>
            <el-tooltip content="刷新当前页">
              <el-button type="primary" :icon="RefreshRight" circle @click="getTableData" />
            </el-tooltip>
          </div>

          <div class="table-wrapper">
            <el-table :data="tableData" border stripe empty-text="暂无我的单据" @selection-change="handleSelectionChange">
              <el-table-column type="selection" width="50" align="center" :selectable="isEditableRow" />
              <el-table-column label="序号" type="index" width="60" align="center" />
              <el-table-column prop="flowName" label="流程定义名称" align="center" min-width="150" show-overflow-tooltip />
              <el-table-column prop="flowCode" label="流程定义编码" align="center" min-width="120" />
              <el-table-column prop="categoryName" label="流程分类" align="center" min-width="100" />
              <el-table-column prop="version" label="版本号" align="center" min-width="90">
                <template #default="scope">
                  <span>v{{ scope.row.version }}.0</span>
                </template>
              </el-table-column>
              <el-table-column label="流程状态" align="center" min-width="100">
                <template #default="scope">
                  <DictTag :options="wf_business_status" :value="scope.row.flowStatus" />
                </template>
              </el-table-column>
              <el-table-column prop="createTime" label="启动时间" align="center" min-width="160" />
              <el-table-column label="操作" align="center" fixed="right" width="280">
                <template #default="scope">
                  <el-button
                    v-if="isEditableRow(scope.row)"
                    type="primary"
                    :icon="Edit"
                    text
                    bg
                    size="small"
                    @click="handleOpen(scope.row, 'update')"
                  >
                    编辑
                  </el-button>
                  <el-button
                    v-if="isEditableRow(scope.row)"
                    type="danger"
                    :icon="Delete"
                    text
                    bg
                    size="small"
                    @click="handleDelete(scope.row)"
                  >
                    删除
                  </el-button>
                  <el-button type="primary" :icon="View" text bg size="small" @click="handleOpen(scope.row, 'view')">
                    查看
                  </el-button>
                  <el-button
                    v-if="canCancelRow(scope.row)"
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
      </el-col>
    </el-row>
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
  margin-bottom: 16px;
}

.toolbar-left {
  display: flex;
  gap: 10px;
}

.table-wrapper {
  margin-bottom: 20px;
}

.pager-wrapper {
  display: flex;
  justify-content: flex-end;
}
</style>
