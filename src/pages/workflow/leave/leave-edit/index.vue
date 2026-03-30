<script lang="ts" setup>
import type { FlowDefinitionQuery, FlowDefinitionVO } from "@/common/apis/workflow/definition/types"
import type { LeaveForm } from "@/common/apis/workflow/leave/types"
import type { StartWorkflowForm } from "@/common/apis/workflow/task/types"
import { ElMessage } from "element-plus"
import { getWorkflowDefinitionListApi } from "@/common/apis/workflow/definition"
import { addWorkflowLeaveApi, getWorkflowLeaveApi, updateWorkflowLeaveApi } from "@/common/apis/workflow/leave"
import { backWorkflowProcessApi, completeWorkflowTaskApi, startWorkflowTaskApi } from "@/common/apis/workflow/task"
import { useTagsViewStore } from "@/pinia/stores/tags-view"
import LeaveEditForm from "./components/LeaveEditForm.vue"

defineOptions({
  name: "AdminWorkflowLeaveEdit"
})

type PageType = "add" | "update" | "view" | "approval"

const router = useRouter()
const route = useRoute()
const tagsViewStore = useTagsViewStore()

const loading = ref(false)
const buttonLoading = ref(false)
const leaveFormRef = ref<InstanceType<typeof LeaveEditForm>>()

const DEFAULT_FORM_DATA: LeaveForm = {
  id: "",
  applyCode: "",
  leaveType: "1",
  startDate: "",
  endDate: "",
  leaveDays: 0,
  remark: "",
  status: "draft"
}
const formData = ref<Partial<LeaveForm>>({ ...DEFAULT_FORM_DATA })

const leaveTypeOptions = [
  { label: "事假", value: "1" },
  { label: "调休", value: "2" },
  { label: "病假", value: "3" },
  { label: "婚假", value: "4" }
]

const flowCode = ref("leave1")
const flowCodeOptions = ref<FlowDefinitionVO[]>([])
const leaveTime = ref<[string, string] | []>([])
const approvalComment = ref("")

const pageType = computed<PageType>(() => {
  const rawType = String(route.query.type || "add")
  if (rawType === "update" || rawType === "view" || rawType === "approval") {
    return rawType
  }
  return "add"
})
const routeId = computed(() => String(route.query.id || ""))
const taskId = computed(() => String(route.query.taskId || ""))

const pageTitle = computed(() => {
  if (pageType.value === "update") return "请假申请 - 编辑"
  if (pageType.value === "view") return "请假申请 - 查看"
  if (pageType.value === "approval") return "请假申请 - 审批"
  return "请假申请 - 新增"
})

const formDisabled = computed(() => pageType.value === "view" || pageType.value === "approval")

function closePage() {
  tagsViewStore.delVisitedView(router.currentRoute.value)
  router.back()
}

function handleLeaveTimeChange() {
  if (!Array.isArray(leaveTime.value) || leaveTime.value.length !== 2) {
    formData.value.leaveDays = 0
    return
  }
  const start = new Date(leaveTime.value[0]).getTime()
  const end = new Date(leaveTime.value[1]).getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    formData.value.leaveDays = 0
    return
  }
  formData.value.leaveDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1
}

async function getFlowCodeOptions() {
  try {
    const query: FlowDefinitionQuery = {
      pageNum: 1,
      pageSize: 200,
      flowCode: undefined,
      flowName: undefined,
      category: undefined,
      isPublish: 1
    }
    const { rows } = await getWorkflowDefinitionListApi(query)
    flowCodeOptions.value = rows
    if (rows.length > 0) {
      flowCode.value = rows[0].flowCode
    }
  } catch {
    flowCodeOptions.value = []
  }
}

async function getInfo() {
  if (!routeId.value) return
  loading.value = true
  try {
    const { data } = await getWorkflowLeaveApi(routeId.value)
    formData.value = { ...data }
    if (data.startDate && data.endDate) {
      leaveTime.value = [data.startDate, data.endDate]
    }
  } finally {
    loading.value = false
  }
}

async function saveLeave(status: "draft" | "waiting") {
  if (!Array.isArray(leaveTime.value) || leaveTime.value.length !== 2) {
    ElMessage.warning("请选择请假时间")
    return
  }

  try {
    const valid = await leaveFormRef.value?.validate()
    if (!valid) return
  } catch {
    return
  }

  buttonLoading.value = true
  try {
    formData.value.startDate = leaveTime.value[0]
    formData.value.endDate = leaveTime.value[1]
    formData.value.status = status

    const payload = formData.value as LeaveForm
    const res = payload.id ? await updateWorkflowLeaveApi(payload) : await addWorkflowLeaveApi(payload)
    formData.value = { ...res.data }

    if (status === "draft") {
      ElMessage.success("暂存成功")
      closePage()
      return
    }

    await handleStartWorkflow(res.data)
  } finally {
    buttonLoading.value = false
  }
}

async function handleStartWorkflow(data: LeaveForm) {
  const startData: StartWorkflowForm = {
    businessId: data.id,
    flowCode: flowCode.value,
    variables: {
      leaveDays: data.leaveDays
    },
    bizExt: {
      businessTitle: "请假申请",
      businessCode: data.applyCode
    }
  }
  await startWorkflowTaskApi(startData)
  ElMessage.success("提交成功")
  closePage()
}

async function handleApprove() {
  if (!taskId.value) {
    ElMessage.error("任务ID不能为空")
    return
  }
  buttonLoading.value = true
  try {
    await completeWorkflowTaskApi({
      taskId: taskId.value,
      message: approvalComment.value || "同意"
    })
    ElMessage.success("审批成功")
    closePage()
  } finally {
    buttonLoading.value = false
  }
}

async function handleReject() {
  if (!taskId.value) {
    ElMessage.error("任务ID不能为空")
    return
  }
  buttonLoading.value = true
  try {
    await backWorkflowProcessApi({
      taskId: taskId.value,
      message: approvalComment.value || "驳回"
    })
    ElMessage.success("驳回成功")
    closePage()
  } finally {
    buttonLoading.value = false
  }
}

onMounted(async () => {
  await getFlowCodeOptions()
  if (pageType.value !== "add") {
    await getInfo()
  }
})
</script>

<template>
  <div class="app-container">
    <el-card shadow="never" class="header-card">
      <div class="header-wrapper">
        <span class="title">{{ pageTitle }}</span>
        <div class="actions">
          <template v-if="pageType !== 'view' && pageType !== 'approval'">
            <el-button :loading="buttonLoading" @click="saveLeave('draft')">
              暂存
            </el-button>
            <el-button type="primary" :loading="buttonLoading" @click="saveLeave('waiting')">
              提交并发起
            </el-button>
          </template>
          <template v-if="pageType === 'approval'">
            <el-button type="danger" :loading="buttonLoading" @click="handleReject">
              驳回
            </el-button>
            <el-button type="primary" :loading="buttonLoading" @click="handleApprove">
              同意
            </el-button>
          </template>
          <el-button @click="closePage">
            返回
          </el-button>
        </div>
      </div>
    </el-card>

    <el-card v-loading="loading" shadow="never">
      <LeaveEditForm
        ref="leaveFormRef"
        v-model:form-data="formData"
        v-model:leave-time="leaveTime"
        v-model:flow-code="flowCode"
        v-model:approval-comment="approvalComment"
        :page-type="pageType"
        :form-disabled="formDisabled"
        :flow-code-options="flowCodeOptions"
        :leave-type-options="leaveTypeOptions"
        @leave-time-change="handleLeaveTimeChange"
      />
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.header-card {
  margin-bottom: 20px;
}

.header-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.title {
  font-size: 16px;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
</style>
