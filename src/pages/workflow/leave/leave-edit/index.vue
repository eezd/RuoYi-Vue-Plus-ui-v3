<script lang="ts" setup>
import type { FlowDefinitionQuery, FlowDefinitionVO } from "@/common/apis/workflow/definition/types"
import type { LeaveForm } from "@/common/apis/workflow/leave/types"
import type { FlowNodeVO, FlowTaskVO, StartWorkflowForm, WorkflowUserDTO } from "@/common/apis/workflow/task/types"
import type { UserVO } from "@/common/apis/system/user/types"
import { ElMessage, ElMessageBox } from "element-plus"
import { getWorkflowDefinitionListApi } from "@/common/apis/workflow/definition"
import { getSysUserListApi } from "@/common/apis/system/user"
import { addWorkflowLeaveApi, getWorkflowLeaveApi, updateWorkflowLeaveApi } from "@/common/apis/workflow/leave"
import {
  backWorkflowProcessApi,
  completeWorkflowTaskApi,
  getWorkflowTaskApi,
  getWorkflowTaskBackNodeApi,
  getWorkflowTaskCurrentAllUserApi,
  getWorkflowTaskNextNodeListApi,
  operateWorkflowTaskApi,
  startWorkflowTaskApi,
  terminationWorkflowTaskApi
} from "@/common/apis/workflow/task"
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

const taskInfo = ref<FlowTaskVO>()
const nextNodeList = ref<FlowNodeVO[]>([])
const assigneeMap = reactive<Record<string, Array<string | number>>>({})
const userOptions = ref<UserVO[]>([])
const userLoading = ref(false)
const operationLoading = ref(false)

const transferDialog = reactive<DialogOption>({ title: "转办", visible: false, loading: false, isEditable: true })
const delegateDialog = reactive<DialogOption>({ title: "委派", visible: false, loading: false, isEditable: true })
const addSignatureDialog = reactive<DialogOption>({ title: "加签", visible: false, loading: false, isEditable: true })
const reductionDialog = reactive<DialogOption>({ title: "减签", visible: false, loading: false, isEditable: true })
const backDialog = reactive<DialogOption>({ title: "退回", visible: false, loading: false, isEditable: true })
const transferUserId = ref<string | number>("")
const delegateUserId = ref<string | number>("")
const addSignatureUserIds = ref<Array<string | number>>([])
const reductionUserIds = ref<Array<string | number>>([])
const currentTaskUsers = ref<WorkflowUserDTO[]>([])
const backNodeList = ref<FlowNodeVO[]>([])
const backNodeCode = ref("")

const taskButtonMap = computed(() => {
  const map: Record<string, boolean> = {}
  taskInfo.value?.buttonList?.forEach((item) => {
    map[item.code] = item.show
  })
  return map
})
const showTaskButton = (code: string) => taskInfo.value?.buttonList?.length ? !!taskButtonMap.value[code] : true

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

async function remoteSearchUsers(keyword: string) {
  userLoading.value = true
  try {
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

function buildTaskVariables() {
  return {
    leaveDays: formData.value.leaveDays
  }
}

function buildAssigneeMap() {
  return Object.fromEntries(
    Object.entries(assigneeMap)
      .filter(([, value]) => value.length > 0)
      .map(([key, value]) => [key, value.join(",")])
  )
}

async function getApprovalTaskInfo() {
  if (pageType.value !== "approval" || !taskId.value) return
  const { data: task } = await getWorkflowTaskApi(taskId.value)
  await remoteSearchUsers("")
  taskInfo.value = task

  try {
    const { data } = await getWorkflowTaskNextNodeListApi({
      taskId: taskId.value,
      variables: buildTaskVariables()
    })
    nextNodeList.value = data || []
    nextNodeList.value.forEach((node) => {
      if (node.nodeCode && !assigneeMap[node.nodeCode]) {
        assigneeMap[node.nodeCode] = []
      }
    })
  } catch {
    nextNodeList.value = []
  }
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
      message: approvalComment.value || "同意",
      variables: buildTaskVariables(),
      assigneeMap: buildAssigneeMap()
    })
    ElMessage.success("审批成功")
    closePage()
  } finally {
    buttonLoading.value = false
  }
}

async function openBackDialog() {
  if (!taskInfo.value?.nodeCode) {
    ElMessage.error("当前任务节点不能为空")
    return
  }
  backDialog.visible = true
  backDialog.loading = true
  try {
    const { data } = await getWorkflowTaskBackNodeApi(taskId.value, taskInfo.value.nodeCode)
    backNodeList.value = data || []
    backNodeCode.value = String(backNodeList.value[0]?.nodeCode || "")
  } finally {
    backDialog.loading = false
  }
}

async function handleReject() {
  if (!taskId.value) {
    ElMessage.error("任务ID不能为空")
    return
  }
  if (!backNodeCode.value) {
    ElMessage.warning("请选择退回节点")
    return
  }
  buttonLoading.value = true
  try {
    await backWorkflowProcessApi({
      taskId: taskId.value,
      nodeCode: backNodeCode.value,
      message: approvalComment.value || "驳回",
      variables: buildTaskVariables(),
      messageType: ["1"]
    })
    ElMessage.success("驳回成功")
    closePage()
  } finally {
    buttonLoading.value = false
  }
}

async function handleTaskOperation(operation: "transferTask" | "delegateTask" | "addSignature" | "reductionSignature") {
  if (!taskId.value) {
    ElMessage.error("任务ID不能为空")
    return
  }
  const operationNameMap = {
    transferTask: "转办",
    delegateTask: "委派",
    addSignature: "加签",
    reductionSignature: "减签"
  }
  const payload = {
    taskId: taskId.value,
    message: approvalComment.value,
    messageType: ["1"],
    userId: operation === "transferTask" ? String(transferUserId.value || "") : String(delegateUserId.value || ""),
    userIds: (operation === "addSignature" ? addSignatureUserIds.value : reductionUserIds.value).map(item => String(item))
  }
  if ((operation === "transferTask" || operation === "delegateTask") && !payload.userId) {
    ElMessage.warning("请选择办理人")
    return
  }
  if ((operation === "addSignature" || operation === "reductionSignature") && (!payload.userIds || payload.userIds.length === 0)) {
    ElMessage.warning("请选择办理人")
    return
  }
  await ElMessageBox.confirm(`确认${operationNameMap[operation]}当前任务吗？`, "提示", { type: "warning" })
  operationLoading.value = true
  try {
    await operateWorkflowTaskApi(payload, operation)
    ElMessage.success("操作成功")
    closePage()
  } finally {
    operationLoading.value = false
  }
}

async function openReductionDialog() {
  reductionDialog.visible = true
  reductionDialog.loading = true
  try {
    const { data } = await getWorkflowTaskCurrentAllUserApi(taskId.value)
    currentTaskUsers.value = data || []
    reductionUserIds.value = []
  } finally {
    reductionDialog.loading = false
  }
}

async function handleTerminationTask() {
  await ElMessageBox.confirm("确认终止当前任务吗？", "提示", { type: "warning" })
  buttonLoading.value = true
  try {
    await terminationWorkflowTaskApi({
      taskId: taskId.value,
      comment: approvalComment.value || "终止"
    })
    ElMessage.success("终止成功")
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
  await getApprovalTaskInfo()
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
            <el-button v-if="showTaskButton('back')" type="danger" :loading="buttonLoading" @click="openBackDialog">
              退回
            </el-button>
            <el-button v-if="showTaskButton('termination')" type="danger" plain :loading="buttonLoading" @click="handleTerminationTask">
              终止
            </el-button>
            <el-button v-if="showTaskButton('trust')" :loading="operationLoading" @click="delegateDialog.visible = true">
              委派
            </el-button>
            <el-button v-if="showTaskButton('transfer')" :loading="operationLoading" @click="transferDialog.visible = true">
              转办
            </el-button>
            <el-button v-if="showTaskButton('addSign') && Number(taskInfo?.nodeRatio || 0) > 0" :loading="operationLoading" @click="addSignatureDialog.visible = true">
              加签
            </el-button>
            <el-button v-if="showTaskButton('subSign') && Number(taskInfo?.nodeRatio || 0) > 0" :loading="operationLoading" @click="openReductionDialog">
              减签
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

      <el-divider v-if="pageType === 'approval' && nextNodeList.length > 0" content-position="left">
        下一节点办理人
      </el-divider>
      <el-form v-if="pageType === 'approval' && nextNodeList.length > 0" label-width="120px">
        <el-form-item v-for="node in nextNodeList" :key="node.nodeCode" :label="node.nodeName || node.nodeCode || '下一节点'">
          <el-select
            v-if="node.nodeCode"
            v-model="assigneeMap[node.nodeCode]"
            multiple
            filterable
            remote
            clearable
            :remote-method="remoteSearchUsers"
            :loading="userLoading"
            placeholder="请选择下一节点办理人"
            class="w-full"
          >
            <el-option
              v-for="item in userOptions"
              :key="item.userId"
              :label="`${item.nickName} (${item.userName})`"
              :value="item.userId"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>
  </div>

  <el-dialog v-model="transferDialog.visible" title="转办" width="420px">
    <el-form label-width="90px">
      <el-form-item label="办理人">
        <el-select v-model="transferUserId" filterable remote clearable :remote-method="remoteSearchUsers" :loading="userLoading" placeholder="请选择办理人" class="w-full">
          <el-option v-for="item in userOptions" :key="item.userId" :label="`${item.nickName} (${item.userName})`" :value="item.userId" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="transferDialog.visible = false">
        取消
      </el-button>
      <el-button type="primary" :loading="operationLoading" @click="handleTaskOperation('transferTask')">
        确认
      </el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="delegateDialog.visible" title="委派" width="420px">
    <el-form label-width="90px">
      <el-form-item label="办理人">
        <el-select v-model="delegateUserId" filterable remote clearable :remote-method="remoteSearchUsers" :loading="userLoading" placeholder="请选择办理人" class="w-full">
          <el-option v-for="item in userOptions" :key="item.userId" :label="`${item.nickName} (${item.userName})`" :value="item.userId" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="delegateDialog.visible = false">
        取消
      </el-button>
      <el-button type="primary" :loading="operationLoading" @click="handleTaskOperation('delegateTask')">
        确认
      </el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="addSignatureDialog.visible" title="加签" width="420px">
    <el-form label-width="90px">
      <el-form-item label="办理人">
        <el-select v-model="addSignatureUserIds" multiple filterable remote clearable :remote-method="remoteSearchUsers" :loading="userLoading" placeholder="请选择办理人" class="w-full">
          <el-option v-for="item in userOptions" :key="item.userId" :label="`${item.nickName} (${item.userName})`" :value="item.userId" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="addSignatureDialog.visible = false">
        取消
      </el-button>
      <el-button type="primary" :loading="operationLoading" @click="handleTaskOperation('addSignature')">
        确认
      </el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="reductionDialog.visible" title="减签" width="520px">
    <el-form v-loading="reductionDialog.loading" label-width="90px">
      <el-form-item label="办理人">
        <el-select v-model="reductionUserIds" multiple clearable placeholder="请选择减签办理人" class="w-full">
          <el-option v-for="item in currentTaskUsers" :key="item.userId" :label="item.nickName || item.userName || String(item.userId)" :value="item.userId" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="reductionDialog.visible = false">
        取消
      </el-button>
      <el-button type="primary" :loading="operationLoading" @click="handleTaskOperation('reductionSignature')">
        确认
      </el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="backDialog.visible" title="退回" width="460px">
    <el-form v-loading="backDialog.loading" label-width="90px">
      <el-form-item label="退回节点">
        <el-select v-model="backNodeCode" clearable placeholder="请选择退回节点" class="w-full">
          <el-option v-for="item in backNodeList" :key="item.nodeCode" :label="item.nodeName || item.nodeCode || '退回节点'" :value="item.nodeCode || ''" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="backDialog.visible = false">
        取消
      </el-button>
      <el-button type="primary" :loading="buttonLoading" @click="handleReject">
        确认
      </el-button>
    </template>
  </el-dialog>
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
