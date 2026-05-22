<script lang="ts" setup>
import type { TabsPaneContext } from "element-plus"
import type { AssigneeDialogForm } from "./components/AssigneeDialog.vue"
import type { UrgeDialogForm } from "./components/UrgeDialog.vue"
import type { UserVO } from "@/common/apis/system/user/types"
import type { FlowTaskVO, TaskQuery } from "@/common/apis/workflow/task/types"
import DictTag from "@@/components/DictTag/index.vue"
import { usePagination } from "@@/composables/usePagination.ts"
import { Edit, Refresh, RefreshRight, Search, View } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { getSysUserListApi } from "@/common/apis/system/user"
import {
  getWorkflowTaskAllFinishPageApi,
  getWorkflowTaskAllWaitPageApi,
  updateWorkflowTaskAssigneeApi,
  urgeWorkflowTaskApi
} from "@/common/apis/workflow/task"
import { useDict } from "@/common/composables/useDict"
import AssigneeDialog from "./components/AssigneeDialog.vue"
import UrgeDialog from "./components/UrgeDialog.vue"

defineOptions({
  name: "AdminWorkflowAllTaskWaiting"
})

const router = useRouter()
const { wf_business_status, wf_task_status } = toRefs<any>(useDict("wf_business_status", "wf_task_status"))
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const loading = ref(false)
const tableData = ref<FlowTaskVO[]>([])
const selectedRows = ref<FlowTaskVO[]>([])
const activeTab = ref<"waiting" | "finish">("waiting")

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

const assigneeDialog = reactive<DialogOption>({
  title: "修改办理人",
  visible: false,
  loading: false,
  isEditable: true
})
const assigneeForm = ref<AssigneeDialogForm>({
  userId: ""
})

const urgeDialog = reactive<DialogOption>({
  title: "催办任务",
  visible: false,
  loading: false,
  isEditable: true
})
const urgeForm = ref<UrgeDialogForm>({
  messageType: "system",
  message: ""
})

const selectedTaskIds = computed<Array<string | number>>(() => selectedRows.value.map(item => item.id))

function normalizePath(path: string) {
  return path.startsWith("/") ? path : `/${path}`
}

function handleSelectionChange(rows: FlowTaskVO[]) {
  selectedRows.value = rows
}

function handleTabClick(tab: TabsPaneContext) {
  activeTab.value = (tab.paneName as "waiting" | "finish") || "waiting"
  paginationData.currentPage = 1
  getTableData()
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

function handleView(row: FlowTaskVO) {
  router.push({
    path: normalizePath(row.formPath),
    query: {
      id: row.businessId,
      type: "view",
      taskId: row.id
    }
  })
}

function openAssigneeDialog() {
  if (selectedTaskIds.value.length === 0) {
    ElMessage.warning("请先选择任务")
    return
  }
  assigneeForm.value.userId = ""
  assigneeDialog.visible = true
}

function openUrgeDialog() {
  if (selectedTaskIds.value.length === 0) {
    ElMessage.warning("请先选择任务")
    return
  }
  urgeForm.value.messageType = "system"
  urgeForm.value.message = ""
  urgeDialog.visible = true
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
  } finally {
    userLoading.value = false
  }
}

async function getTableData() {
  try {
    loading.value = true
    const query: TaskQuery = {
      ...searchData,
      createByIds: createByIds.value,
      pageNum: paginationData.currentPage,
      pageSize: paginationData.pageSize
    }
    const targetApi = activeTab.value === "waiting" ? getWorkflowTaskAllWaitPageApi : getWorkflowTaskAllFinishPageApi
    const { rows, total } = await targetApi(query)
    tableData.value = rows
    paginationData.total = total
  } catch {
    tableData.value = []
  } finally {
    loading.value = false
  }
}

async function handleUpdateAssignee() {
  if (!assigneeForm.value.userId) {
    ElMessage.warning("请选择办理人")
    return
  }
  assigneeDialog.loading = true
  try {
    const res = await updateWorkflowTaskAssigneeApi({
      userId: assigneeForm.value.userId,
      taskIdList: selectedTaskIds.value
    })
    ElMessage.success(res.msg || "操作成功")
    assigneeDialog.visible = false
    await getTableData()
  } finally {
    assigneeDialog.loading = false
  }
}

async function handleUrgeTask() {
  urgeDialog.loading = true
  try {
    const res = await urgeWorkflowTaskApi({
      taskIdList: selectedTaskIds.value,
      messageType: urgeForm.value.messageType,
      message: urgeForm.value.message
    })
    ElMessage.success(res.msg || "催办成功")
    urgeDialog.visible = false
    await getTableData()
  } finally {
    urgeDialog.loading = false
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
        <div class="toolbar-left">
          <template v-if="activeTab === 'waiting'">
            <el-button type="primary" plain :icon="Edit" :disabled="selectedTaskIds.length === 0" @click="openAssigneeDialog">
              修改办理人
            </el-button>
            <el-button type="warning" plain :disabled="selectedTaskIds.length === 0" @click="openUrgeDialog">
              催办
            </el-button>
          </template>
        </div>
        <el-tooltip content="刷新当前页">
          <el-button type="primary" :icon="RefreshRight" circle @click="getTableData" />
        </el-tooltip>
      </div>

      <div class="table-wrapper">
        <el-tabs v-model="activeTab" @tab-click="handleTabClick">
          <el-tab-pane name="waiting" label="待办任务" />
          <el-tab-pane name="finish" label="已办任务" />

          <el-table :data="tableData" border @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="50" align="center" />
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
            <el-table-column prop="nodeName" label="任务名称" align="center" min-width="120" show-overflow-tooltip />
            <el-table-column prop="createByName" label="申请人" align="center" min-width="100" show-overflow-tooltip />
            <el-table-column label="办理人" align="center" min-width="150">
              <template #default="scope">
                <span v-if="activeTab === 'waiting'">{{ scope.row.assigneeNames || "无" }}</span>
                <el-tag v-else type="success">
                  {{ scope.row.approveName || "无" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="流程状态" align="center" min-width="100">
              <template #default="scope">
                <DictTag :options="wf_business_status" :value="scope.row.flowStatus" />
              </template>
            </el-table-column>
            <el-table-column v-if="activeTab === 'finish'" label="任务状态" align="center" min-width="100">
              <template #default="scope">
                <DictTag :options="wf_task_status" :value="scope.row.flowTaskStatus" />
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" align="center" min-width="160" />
            <el-table-column label="操作" align="center" width="100" fixed="right">
              <template #default="scope">
                <el-button type="primary" :icon="View" text bg size="small" @click="handleView(scope.row)">
                  查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tabs>
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

    <AssigneeDialog
      v-model:dialog="assigneeDialog"
      v-model:form-data="assigneeForm"
      :user-options="userOptions"
      :user-loading="userLoading"
      @remote-search-users="remoteSearchUsers"
      @submit="handleUpdateAssignee"
    />

    <UrgeDialog
      v-model:dialog="urgeDialog"
      v-model:form-data="urgeForm"
      @submit="handleUrgeTask"
    />
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
  flex-wrap: wrap;
}

.table-wrapper {
  margin-bottom: 20px;
}

.pager-wrapper {
  display: flex;
  justify-content: flex-end;
}
</style>
