<script lang="ts" setup>
import type { UserVO } from "@/common/apis/system/user/types"
import type { FlowTaskVO, TaskQuery } from "@/common/apis/workflow/task/types"
import DictTag from "@@/components/DictTag/index.vue"
import { usePagination } from "@@/composables/usePagination.ts"
import { Refresh, RefreshRight, Search } from "@element-plus/icons-vue"
import { getSysUserListApi } from "@/common/apis/system/user"
import { getWorkflowTaskWaitPageApi } from "@/common/apis/workflow/task"
import { useDict } from "@/common/composables/useDict"
import { routerJumpWorkflowForm } from "@/common/apis/workflow/workflow-common"

defineOptions({
  name: "AdminWorkflowTaskWaiting"
})

const router = useRouter()
const { wf_business_status } = toRefs<any>(useDict("wf_business_status"))
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const loading = ref(false)
const tableData = ref<FlowTaskVO[]>([])

const searchData = reactive({
  nodeName: undefined,
  flowCode: undefined,
  flowName: undefined,
  createByIds: undefined
} as TaskQuery)
const searchFormRef = useTemplateRef("searchFormRef")

const createByIds = ref<Array<string | number>>([])
const userOptions = ref<UserVO[]>([])
const userLoading = ref(false)


function handleOpen(row: FlowTaskVO) {
  routerJumpWorkflowForm(router, {
    businessId: row.businessId,
    taskId: row.id,
    type: "approval",
    formCustom: row.formCustom,
    formPath: row.formPath
  })
}

function resetSearch() {
  searchFormRef.value?.resetFields()
  createByIds.value = []
  handleQuery()
}

function handleQuery() {
  paginationData.currentPage = 1
  searchData.createByIds = createByIds.value
  getTableData()
}

async function remoteSearchUsers(keyword: string) {
  try {
    userLoading.value = true
    const { rows } = await getSysUserListApi({
      pageNum: 1,
      pageSize: 20,
      userName: keyword || undefined,
      nickName: keyword || undefined,
      status: "0"
    } as any)
    userOptions.value = rows
  } catch {
    userOptions.value = []
  } finally {
    userLoading.value = false
  }
}

async function getTableData() {
  try {
    loading.value = true
    const { rows, total } = await getWorkflowTaskWaitPageApi({
      ...searchData,
      createByIds: createByIds.value,
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

onMounted(async () => {
  await remoteSearchUsers("")
  await getTableData()
})
</script>

<template>
  <div class="app-container">
    <el-card v-loading="loading" shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item label="申请人">
          <el-select
            v-model="createByIds"
            multiple
            collapse-tags
            collapse-tags-tooltip
            filterable
            remote
            clearable
            :remote-method="remoteSearchUsers"
            :loading="userLoading"
            placeholder="请选择申请人"
            class="min-w-[220px]"
          >
            <el-option
              v-for="item in userOptions"
              :key="item.userId"
              :label="`${item.nickName} (${item.userName})`"
              :value="item.userId"
            />
          </el-select>
        </el-form-item>
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
          <el-table-column prop="nodeName" label="任务名称" align="center" min-width="100" />
          <el-table-column prop="createByName" label="申请人" align="center" min-width="100" />
          <el-table-column label="办理人" align="center" min-width="160">
            <template #default="scope">
              <span>{{ scope.row.assigneeNames || "无" }}</span>
            </template>
          </el-table-column>
          <el-table-column label="流程状态" align="center" min-width="100">
            <template #default="scope">
              <DictTag :options="wf_business_status" :value="scope.row.flowStatus" />
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" align="center" min-width="160" />
          <el-table-column label="操作" align="center" width="100" fixed="right">
            <template #default="scope">
              <el-button type="primary" text bg size="small" @click="handleOpen(scope.row)">
                办理
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
