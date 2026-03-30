<script lang="ts" setup>
import type { TabsPaneContext } from "element-plus"
import type { InstanceVariableDialogState } from "./components/InstanceVariableDialog.vue"
import type { UserVO } from "@/common/apis/system/user/types"
import type { CategoryTreeVO } from "@/common/apis/workflow/category/types"
import type { FlowInstanceQuery, FlowInstanceVO, FlowVariableForm } from "@/common/apis/workflow/instance/types"
import { usePagination } from "@@/composables/usePagination.ts"
import { Refresh, Search } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { getSysUserListApi } from "@/common/apis/system/user"
import { getWorkflowCategoryTreeApi } from "@/common/apis/workflow/category"
import {
  deleteWorkflowHistoryInstanceByIdsApi,
  deleteWorkflowInstanceByIdsApi,
  getWorkflowInstanceFinishPageApi,
  getWorkflowInstanceRunningPageApi,
  getWorkflowInstanceVariableApi,
  invalidWorkflowInstanceApi,
  updateWorkflowInstanceVariableApi
} from "@/common/apis/workflow/instance"
import { useDict } from "@/common/composables/useDict"
import InstanceVariableDialog from "./components/InstanceVariableDialog.vue"
import ProcessInstanceTable from "./components/ProcessInstanceTable.vue"

defineOptions({
  name: "AdminWorkflowProcessInstance"
})

const router = useRouter()
const { wf_business_status } = toRefs<any>(useDict("wf_business_status"))
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const loading = ref(false)
const tableData = ref<FlowInstanceVO[]>([])
const activeTab = ref<"running" | "finish">("running")

const searchData = reactive({
  category: undefined,
  nodeName: undefined,
  flowCode: undefined,
  flowName: undefined,
  createByIds: undefined
} as FlowInstanceQuery)
const searchFormRef = useTemplateRef("searchFormRef")

const categoryName = ref("")
const treeOptions = ref<CategoryTreeVO[]>([])
const treeRef = useTemplateRef("treeRef")

const createByIds = ref<Array<string | number>>([])
const userOptions = ref<UserVO[]>([])
const userLoading = ref(false)

const variableDialog = reactive<InstanceVariableDialogState>({
  visible: false,
  loading: false,
  title: "流程变量",
  processName: "",
  rawVariable: ""
})
const variableForm = ref<FlowVariableForm>({
  instanceId: "",
  key: "",
  value: ""
})

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

function handleTabClick(tab: TabsPaneContext) {
  activeTab.value = (tab.paneName as "running" | "finish") || "running"
  paginationData.currentPage = 1
  getTableData()
}

async function getCategoryTree() {
  const res = await getWorkflowCategoryTreeApi()
  treeOptions.value = res.data
}

function filterNode(value: string, data: any) {
  if (!value) return true
  return data.label.includes(value)
}

function handleNodeClick(data: CategoryTreeVO) {
  searchData.category = data.id === "ALL" || String(data.id) === "0" ? undefined : data.id
  handleQuery()
}

watchEffect(
  () => {
    treeRef.value?.filter(categoryName.value)
  },
  { flush: "post" }
)

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
    const query: FlowInstanceQuery = {
      ...searchData,
      createByIds: createByIds.value,
      pageNum: paginationData.currentPage,
      pageSize: paginationData.pageSize
    }
    const targetApi = activeTab.value === "running" ? getWorkflowInstanceRunningPageApi : getWorkflowInstanceFinishPageApi
    const { rows, total } = await targetApi(query)
    tableData.value = rows
    paginationData.total = total
  } catch {
    tableData.value = []
  } finally {
    loading.value = false
  }
}

async function handleDelete(rows: FlowInstanceVO[]) {
  if (rows.length === 0) {
    ElMessage.warning("请选择要删除的数据")
    return
  }
  await ElMessageBox.confirm(`确认删除选中的 ${rows.length} 条流程实例吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
  loading.value = true
  try {
    const ids = rows.map(item => item.id)
    if (activeTab.value === "running") {
      await deleteWorkflowInstanceByIdsApi(ids)
    } else {
      await deleteWorkflowHistoryInstanceByIdsApi(ids)
    }
    ElMessage.success("删除成功")
    await getTableData()
  } finally {
    loading.value = false
  }
}

async function handleInvalid(row: FlowInstanceVO) {
  const { value } = await ElMessageBox.prompt("请输入作废原因", "作废流程", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    inputPlaceholder: "作废原因",
    inputValue: ""
  })
  loading.value = true
  try {
    await invalidWorkflowInstanceApi({
      id: row.id,
      comment: value || ""
    })
    ElMessage.success("作废成功")
    await getTableData()
  } finally {
    loading.value = false
  }
}

function normalizePath(path: string) {
  return path.startsWith("/") ? path : `/${path}`
}

function handleView(row: FlowInstanceVO) {
  router.push({
    path: normalizePath(row.formPath),
    query: {
      id: row.businessId,
      type: "view",
      taskId: row.id
    }
  })
}

async function openVariableDialog(row: FlowInstanceVO) {
  variableDialog.visible = true
  variableDialog.loading = true
  variableDialog.processName = row.flowName
  variableForm.value = {
    instanceId: row.id,
    key: "",
    value: ""
  }
  try {
    const { data } = await getWorkflowInstanceVariableApi(row.id)
    variableDialog.rawVariable = data.variable || "{}"
  } finally {
    variableDialog.loading = false
  }
}

async function handleUpdateVariable(payload: FlowVariableForm) {
  variableDialog.loading = true
  try {
    const res = await updateWorkflowInstanceVariableApi(payload)
    ElMessage.success(res.msg || "更新成功")
    const { data } = await getWorkflowInstanceVariableApi(payload.instanceId)
    variableDialog.rawVariable = data.variable || "{}"
  } finally {
    variableDialog.loading = false
  }
}

watch(
  [() => paginationData.currentPage, () => paginationData.pageSize],
  () => {
    getTableData()
  }
)

onMounted(async () => {
  await Promise.all([getCategoryTree(), remoteSearchUsers("")])
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

        <ProcessInstanceTable
          v-model:loading="loading"
          v-model:table-data="tableData"
          v-model:pagination-data="paginationData"
          v-model:active-tab="activeTab"
          :wf-business-status="wf_business_status"
          @handle-delete="handleDelete"
          @handle-invalid="handleInvalid"
          @handle-view="handleView"
          @open-variable-dialog="openVariableDialog"
          @handle-current-change="handleCurrentChange"
          @handle-size-change="handleSizeChange"
          @get-table-data="getTableData"
          @handle-tab-click="handleTabClick"
        />
      </el-col>
    </el-row>

    <InstanceVariableDialog
      v-model:dialog="variableDialog"
      v-model:form-data="variableForm"
      @submit="handleUpdateVariable"
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
</style>
