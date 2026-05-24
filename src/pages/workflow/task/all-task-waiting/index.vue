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
import { routerJumpWorkflowForm } from "@/common/apis/workflow/workflow-common"
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
const isWaitingTab = computed(() => activeTab.value === "waiting")
const canBatchOperate = computed(() => isWaitingTab.value && selectedTaskIds.value.length > 0)
const tableTitle = computed(() => isWaitingTab.value ? "全部待办任务" : "全部已办任务")
const tableEmptyText = computed(() => isWaitingTab.value ? "暂无待办任务" : "暂无已办任务")

function handleSelectionChange(rows: FlowTaskVO[]) {
  selectedRows.value = isWaitingTab.value ? rows : []
}

function selectableTaskRow() {
  return isWaitingTab.value
}

function handleTabClick(tab: TabsPaneContext) {
  activeTab.value = (tab.paneName as "waiting" | "finish") || "waiting"
  selectedRows.value = []
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

function handleOpen(row: FlowTaskVO) {
  routerJumpWorkflowForm(router, {
    businessId: row.businessId,
    taskId: row.id,
    type: isWaitingTab.value ? "approval" : "view",
    formCustom: row.formCustom,
    formPath: row.formPath
  })
}

function assertWaitingSelection() {
  if (!isWaitingTab.value) {
    ElMessage.warning("已办任务不支持办理人修改或催办")
    return false
  }
  if (selectedTaskIds.value.length === 0) {
    ElMessage.warning("请先选择待办任务")
    return false
  }
  return true
}

function openAssigneeDialog() {
  if (!assertWaitingSelection()) return
  assigneeForm.value.userId = ""
  assigneeDialog.visible = true
}

function openUrgeDialog() {
  if (!assertWaitingSelection()) return
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
  } catch {
    userOptions.value = []
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
  if (!assertWaitingSelection()) return
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
  if (!assertWaitingSelection()) return
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

onActivated(async () => {
  await getTableData()
})

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
          <div class="table-heading">{{ tableTitle }}</div>
          <template v-if="isWaitingTab">
            <el-button type="primary" plain :icon="Edit" :disabled="!canBatchOperate" @click="openAssigneeDialog">
              修改办理人
            </el-button>
            <el-button type="warning" plain :disabled="!canBatchOperate" @click="openUrgeDialog">
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

          <el-table :data="tableData" border stripe :empty-text="tableEmptyText" @selection-change="handleSelectionChange">
            <el-table-column v-if="isWaitingTab" type="selection" width="50" align="center" :selectable="selectableTaskRow" />
            <el-table-column label="序号" type="index" width="60" align="center" />
            <el-table-column prop="businessCode" label="业务编码" align="center" min-width="130" show-overflow-tooltip />
            <el-table-column prop="businessTitle" label="业务标题" align="center" min-width="150" show-overflow-tooltip />
            <el-table-column prop="flowName" label="流程定义名称" align="center" min-width="150" show-overflow-tooltip />
            <el-table-column prop="flowCode" label="流程定义编码" align="center" min-width="120" show-overflow-tooltip />
            <el-table-column prop="categoryName" label="流程分类" align="center" min-width="100" show-overflow-tooltip />
            <el-table-column prop="version" label="版本号" align="center" min-width="90">
              <template #default="scope">
                <span>v{{ scope.row.version }}.0</span>
              </template>
            </el-table-column>
            <el-table-column prop="nodeName" label="任务名称" align="center" min-width="120" show-overflow-tooltip />
            <el-table-column prop="createByName" label="申请人" align="center" min-width="100" show-overflow-tooltip />
            <el-table-column label="办理人" align="center" min-width="150" show-overflow-tooltip>
              <template #default="scope">
                <span>{{ isWaitingTab ? (scope.row.assigneeNames || "无") : (scope.row.approveName || scope.row.assigneeNames || "无") }}</span>
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
            <el-table-column v-if="!isWaitingTab" prop="updateTime" label="完成时间" align="center" min-width="160">
              <template #default="scope">
                {{ scope.row.updateTime || "-" }}
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="110" fixed="right">
              <template #default="scope">
                <el-button type="primary" :icon="View" text bg size="small" @click="handleOpen(scope.row)">
                  {{ isWaitingTab ? "办理" : "查看" }}
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
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.table-heading {
  margin-right: 6px;
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 600;
}

.table-wrapper {
  margin-bottom: 20px;
}

.pager-wrapper {
  display: flex;
  justify-content: flex-end;
}
</style>
