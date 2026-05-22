<script lang="ts" setup>
import type { FlowTaskVO, TaskQuery } from "@/common/apis/workflow/task/types"
import DictTag from "@@/components/DictTag/index.vue"
import { usePagination } from "@@/composables/usePagination.ts"
import { Refresh, RefreshRight, Search, View } from "@element-plus/icons-vue"
import { getWorkflowTaskCopyPageApi } from "@/common/apis/workflow/task"
import { useDict } from "@/common/composables/useDict"
import { routerJumpWorkflowForm } from "@/common/apis/workflow/workflow-common"

defineOptions({
  name: "AdminWorkflowTaskCopyList"
})

const router = useRouter()
const { wf_business_status } = toRefs<any>(useDict("wf_business_status"))
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const loading = ref(false)
const tableData = ref<FlowTaskVO[]>([])

const searchData = reactive({
  nodeName: undefined,
  flowCode: undefined,
  flowName: undefined
} as TaskQuery)
const searchFormRef = useTemplateRef("searchFormRef")


function handleView(row: FlowTaskVO) {
  routerJumpWorkflowForm(router, {
    businessId: row.businessId,
    taskId: row.id,
    type: "view",
    formCustom: row.formCustom,
    formPath: row.formPath
  })
}

function resetSearch() {
  searchFormRef.value?.resetFields()
  handleQuery()
}

function handleQuery() {
  paginationData.currentPage = 1
  getTableData()
}

async function getTableData() {
  try {
    loading.value = true
    const { rows, total } = await getWorkflowTaskCopyPageApi({
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
  <div class="app-container">
    <el-card v-loading="loading" shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item label="任务名称" prop="nodeName">
          <el-input v-model="searchData.nodeName" placeholder="请输入任务名称" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="流程定义名称" prop="flowName">
          <el-input v-model="searchData.flowName" placeholder="请输入流程定义名称" @keyup.enter="handleQuery" />
        </el-form-item>
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
        <div />
        <el-tooltip content="刷新当前页">
          <el-button type="primary" :icon="RefreshRight" circle @click="getTableData" />
        </el-tooltip>
      </div>
      <div class="table-wrapper">
        <el-table :data="tableData" border>
          <el-table-column label="序号" type="index" width="60" align="center" />
          <el-table-column prop="businessCode" label="业务编码" align="center" min-width="130" show-overflow-tooltip />
          <el-table-column prop="businessTitle" label="业务标题" align="center" min-width="150" show-overflow-tooltip />
          <el-table-column prop="flowName" label="流程定义名称" align="center" min-width="150" show-overflow-tooltip />
          <el-table-column prop="flowCode" label="流程定义编码" align="center" min-width="120" />
          <el-table-column prop="categoryName" label="流程分类" align="center" min-width="100" />
          <el-table-column prop="version" label="版本号" align="center" min-width="90">
            <template #default="scope">
              <span>v{{ scope.row.version }}.0</span>
            </template>
          </el-table-column>
          <el-table-column prop="nodeName" label="任务名称" align="center" min-width="120" />
          <el-table-column label="流程状态" align="center" min-width="100">
            <template #default="scope">
              <DictTag :options="wf_business_status" :value="scope.row.flowStatus" />
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="100" fixed="right">
            <template #default="scope">
              <el-button type="primary" :icon="View" text bg size="small" @click="handleView(scope.row)">
                查看
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
  margin-bottom: 16px;
}

.table-wrapper {
  margin-bottom: 20px;
}

.pager-wrapper {
  display: flex;
  justify-content: flex-end;
}
</style>
