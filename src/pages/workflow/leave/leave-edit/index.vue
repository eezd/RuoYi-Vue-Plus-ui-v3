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
import ApprovalRecordDialog from "../../components/approval-record-dialog.vue"
import LeaveEditForm from "./components/LeaveEditForm.vue"

defineOptions({
  name: "AdminWorkflowLeaveEdit"
})

type PageType = "add" | "update" | "view" | "approval"
type TaskOperationType = "transferTask" | "delegateTask" | "addSignature" | "reductionSignature"

const DEFAULT_BUTTON_PERMISSION: Record<string, boolean> = {
  pop: false,
  trust: false,
  transfer: false,
  copy: true,
  back: true,
  addSign: false,
  subSign: false,
  termination: true,
  file: true
}

const TASK_OPERATION_NAME_MAP: Record<TaskOperationType, string> = {
  transferTask: "转办",
  delegateTask: "委派",
  addSignature: "加签",
  reductionSignature: "减签"
}

const router = useRouter()
const route = useRoute()
const tagsViewStore = useTagsViewStore()

const loading = ref(false)
const buttonLoading = ref(false)
const leaveFormRef = ref<InstanceType<typeof LeaveEditForm>>()
const approvalRecordDialogRef = ref<InstanceType<typeof ApprovalRecordDialog>>()

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
const messageType = ref<string[]>(["1"])

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
const copyUserIds = ref<Array<string | number>>([])
const backNodeList = ref<FlowNodeVO[]>([])
const backNodeCode = ref("")

const taskButtonMap = computed(() => {
  const map: Record<string, boolean> = { ...DEFAULT_BUTTON_PERMISSION }
  taskInfo.value?.buttonList?.forEach((item) => {
    map[item.code] = item.show
  })
  return map
})
const showTaskButton = (code: string) => !!taskButtonMap.value[code]

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
const showApprovalPanel = computed(() => pageType.value === "approval")
const showNextNodeAssignee = computed(() => showApprovalPanel.value && showTaskButton("pop") && nextNodeList.value.length > 0)
const canHandleSignature = computed(() => Number(taskInfo.value?.nodeRatio || 0) > 0)
const handleableFlowStatusList = ["draft", "cancel", "back", "waiting"]
const canSubmitApproval = computed(() => pageType.value === "approval" && !!taskId.value && (!taskInfo.value || handleableFlowStatusList.includes(taskInfo.value.flowStatus)))
const currentTaskUserIdSet = computed(() => new Set(currentTaskUsers.value.map(item => String(item.userId))))
const addSignatureUserOptions = computed(() => userOptions.value.filter(item => !currentTaskUserIdSet.value.has(String(item.userId))))
const flowCopyList = computed(() => copyUserIds.value.map((userId) => {
  const user = userOptions.value.find(item => String(item.userId) === String(userId))
  const copyUser = taskInfo.value?.copyList?.find(item => String(item.userId) === String(userId))
  return {
    userId,
    nickName: user?.nickName || copyUser?.nickName || String(userId)
  }
}))

function mergeUserOptions(users: Array<Partial<UserVO>>) {
  const userMap = new Map(userOptions.value.map(item => [String(item.userId), item]))
  users.forEach((user) => {
    if (!user.userId) return
    const userId = String(user.userId)
    userMap.set(userId, {
      ...userMap.get(userId),
      userId,
      userName: user.userName || userMap.get(userId)?.userName || userId,
      nickName: user.nickName || userMap.get(userId)?.nickName || user.userName || userId
    } as UserVO)
  })
  userOptions.value = Array.from(userMap.values())
}

function mergeTaskAssigneeOptions(task: FlowTaskVO) {
  const ids = String((task as any).assigneeIds || "").split(",").filter(Boolean)
  const names = String(task.assigneeNames || "").split(",").filter(Boolean)
  mergeUserOptions(ids.map((id, index) => ({
    userId: id,
    userName: id,
    nickName: names[index] || id
  })))
}

function closePage() {
  tagsViewStore.delVisitedView(router.currentRoute.value)
  router.back()
}

function closeOperationDialogs() {
  transferDialog.visible = false
  delegateDialog.visible = false
  addSignatureDialog.visible = false
  reductionDialog.visible = false
  backDialog.visible = false
}

function resetApprovalState() {
  taskInfo.value = undefined
  nextNodeList.value = []
  Object.keys(assigneeMap).forEach(key => delete assigneeMap[key])
  userOptions.value = []
  transferUserId.value = ""
  delegateUserId.value = ""
  addSignatureUserIds.value = []
  reductionUserIds.value = []
  currentTaskUsers.value = []
  copyUserIds.value = []
  backNodeList.value = []
  backNodeCode.value = ""
  approvalComment.value = ""
  messageType.value = ["1"]
  closeOperationDialogs()
}

async function initPageData() {
  resetApprovalState()
  formData.value = { ...DEFAULT_FORM_DATA }
  leaveTime.value = []
  await getFlowCodeOptions()
  if (pageType.value !== "add") {
    await getInfo()
  }
  await getApprovalTaskInfo()
}

function openApprovalRecord() {
  approvalRecordDialogRef.value?.open({
    businessId: routeId.value || formData.value.id,
    title: `审批记录 - ${formData.value.applyCode || "请假申请"}`
  })
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
      leaveDays: data.leaveDays,
      userList: ["1761100000000000001", "1761100000000000003", "1761100000000000004"]
    },
    bizExt: {
      businessTitle: "请假申请",
      businessCode: data.applyCode
    }
  }
  const { data: startResult } = await startWorkflowTaskApi(startData)
  ElMessage.success("流程已发起，请继续提交申请人节点")
  await router.replace({
    path: "/workflow/leaveEdit/index",
    query: {
      id: data.id,
      taskId: startResult.taskId,
      type: "approval"
    }
  })
  await nextTick()
  await getApprovalTaskInfo()
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
    mergeUserOptions(rows)
  } catch {
    userOptions.value = []
  } finally {
    userLoading.value = false
  }
}

function buildTaskVariables() {
  return {
    leaveDays: formData.value.leaveDays,
    userList: ["1761100000000000001", "1761100000000000003", "1761100000000000004"]
  }
}

function buildAssigneeMap() {
  return Object.fromEntries(
    Object.entries(assigneeMap)
      .filter(([, value]) => value.length > 0)
      .map(([key, value]) => [key, value.join(",")])
  )
}

function validateTaskId() {
  if (taskId.value) return true
  ElMessage.error("任务ID不能为空，请从待办任务进入审批页")
  return false
}

function validatePopAssignee() {
  if (!showTaskButton("pop") || nextNodeList.value.length === 0) return true
  const missingNode = nextNodeList.value.find(node => node.nodeCode && (!assigneeMap[node.nodeCode] || assigneeMap[node.nodeCode].length === 0))
  if (!missingNode) return true
  ElMessage.warning(`请选择${missingNode.nodeName || missingNode.nodeCode || "下一节点"}办理人`)
  return false
}

function buildBaseTaskPayload(defaultMessage: string) {
  return {
    taskId: taskId.value,
    message: approvalComment.value || defaultMessage,
    messageType: [...messageType.value],
    variables: buildTaskVariables()
  }
}

function resetOperationDialog(operation: TaskOperationType) {
  if (operation === "transferTask") transferUserId.value = ""
  if (operation === "delegateTask") delegateUserId.value = ""
  if (operation === "addSignature") addSignatureUserIds.value = []
  if (operation === "reductionSignature") reductionUserIds.value = []
}

async function openOperationDialog(operation: TaskOperationType) {
  if (!validateTaskId()) return
  resetOperationDialog(operation)
  await remoteSearchUsers("")
  if (operation === "transferTask") {
    transferDialog.visible = true
    return
  }
  if (operation === "delegateTask") {
    delegateDialog.visible = true
    return
  }
  if (operation === "addSignature") {
    addSignatureDialog.visible = true
    return
  }
  await openReductionDialog()
}

async function getApprovalTaskInfo() {
  if (pageType.value !== "approval" || !taskId.value) return
  const { data: task } = await getWorkflowTaskApi(taskId.value)
  await remoteSearchUsers("")
  taskInfo.value = task
  mergeTaskAssigneeOptions(task)
  try {
    const { data: taskUsers } = await getWorkflowTaskCurrentAllUserApi(taskId.value)
    currentTaskUsers.value = taskUsers || []
    mergeUserOptions(taskUsers || [])
  } catch {
    currentTaskUsers.value = []
  }
  copyUserIds.value = task.copyList?.map(item => item.userId) || []

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
  if (!validateTaskId()) return
  if (!validatePopAssignee()) return
  await ElMessageBox.confirm("确认同意并提交当前任务吗？", "提示", { type: "warning" })
  buttonLoading.value = true
  try {
    await completeWorkflowTaskApi({
      ...buildBaseTaskPayload("同意"),
      assigneeMap: showTaskButton("pop") ? buildAssigneeMap() : {},
      flowCopyList: showTaskButton("copy") ? flowCopyList.value : []
    })
    ElMessage.success("审批成功")
    closePage()
  } finally {
    buttonLoading.value = false
  }
}

async function openBackDialog() {
  if (!validateTaskId()) return
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
  if (!validateTaskId()) return
  if (!backNodeCode.value) {
    ElMessage.warning("请选择退回节点")
    return
  }
  await ElMessageBox.confirm("确认退回当前任务吗？", "提示", { type: "warning" })
  buttonLoading.value = true
  try {
    await backWorkflowProcessApi({
      ...buildBaseTaskPayload("驳回"),
      nodeCode: backNodeCode.value,
      notice: ""
    })
    ElMessage.success("驳回成功")
    closePage()
  } finally {
    buttonLoading.value = false
  }
}

async function handleTaskOperation(operation: TaskOperationType) {
  if (!validateTaskId()) return
  const userIds = (operation === "addSignature" ? addSignatureUserIds.value : reductionUserIds.value).map(item => String(item))
  const payload = {
    taskId: taskId.value,
    message: approvalComment.value || TASK_OPERATION_NAME_MAP[operation],
    messageType: [...messageType.value],
    userId: operation === "transferTask" ? String(transferUserId.value || "") : String(delegateUserId.value || ""),
    userIds
  }
  if ((operation === "transferTask" || operation === "delegateTask") && !payload.userId) {
    ElMessage.warning("请选择办理人")
    return
  }
  if (operation === "addSignature" && userIds.some(userId => currentTaskUserIdSet.value.has(userId))) {
    ElMessage.warning("加签办理人不能选择当前节点已有办理人")
    return
  }
  if ((operation === "addSignature" || operation === "reductionSignature") && (!payload.userIds || payload.userIds.length === 0)) {
    ElMessage.warning("请选择办理人")
    return
  }
  await ElMessageBox.confirm(`确认${TASK_OPERATION_NAME_MAP[operation]}当前任务吗？`, "提示", { type: "warning" })
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
  if (!validateTaskId()) return
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
  if (!validateTaskId()) return
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

watch(() => route.fullPath, async () => {
  await initPageData()
})

onMounted(async () => {
  await initPageData()
})
</script>

<template>
  <div class="app-container workflow-leave-edit-page">
    <el-card shadow="never" class="header-card">
      <div class="header-wrapper">
        <div class="title-block">
          <span class="title">{{ pageTitle }}</span>
          <span v-if="pageType === 'approval'" class="subtitle">{{ taskInfo?.nodeName || "当前审批节点" }}</span>
        </div>
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
            <div class="action-group action-group-primary">
              <el-button type="primary" :loading="buttonLoading" :disabled="!canSubmitApproval" @click="handleApprove">
                同意
              </el-button>
              <el-button v-if="showTaskButton('back')" type="warning" :loading="buttonLoading" :disabled="!canSubmitApproval" @click="openBackDialog">
                退回
              </el-button>
              <el-button v-if="showTaskButton('termination')" type="danger" plain :loading="buttonLoading" :disabled="!canSubmitApproval" @click="handleTerminationTask">
                终止
              </el-button>
            </div>
            <div class="action-group">
              <el-button v-if="showTaskButton('trust')" :loading="operationLoading" :disabled="!canSubmitApproval" @click="openOperationDialog('delegateTask')">
                委派
              </el-button>
              <el-button v-if="showTaskButton('transfer')" :loading="operationLoading" :disabled="!canSubmitApproval" @click="openOperationDialog('transferTask')">
                转办
              </el-button>
              <el-button v-if="showTaskButton('addSign') && canHandleSignature" :loading="operationLoading" :disabled="!canSubmitApproval" @click="openOperationDialog('addSignature')">
                加签
              </el-button>
              <el-button v-if="showTaskButton('subSign') && canHandleSignature" :loading="operationLoading" :disabled="!canSubmitApproval" @click="openOperationDialog('reductionSignature')">
                减签
              </el-button>
            </div>
          </template>
          <el-button v-if="pageType === 'view' || pageType === 'approval'" @click="openApprovalRecord">
            审批记录
          </el-button>
          <el-button @click="closePage">
            返回
          </el-button>
        </div>
      </div>
    </el-card>

    <el-card v-loading="loading" shadow="never" class="form-card">
      <div class="form-scroll-area">
        <LeaveEditForm
          ref="leaveFormRef"
          v-model:form-data="formData"
          v-model:leave-time="leaveTime"
          v-model:flow-code="flowCode"
          :page-type="pageType"
          :form-disabled="formDisabled"
          :flow-code-options="flowCodeOptions"
          :leave-type-options="leaveTypeOptions"
          @leave-time-change="handleLeaveTimeChange"
        />

        <div v-if="showApprovalPanel" class="approval-panel">
          <div class="panel-title">审批处理</div>
          <el-alert
            v-if="!taskId"
            title="当前审批页面缺少 taskId，请从待办任务进入。"
            type="warning"
            show-icon
            :closable="false"
            class="approval-alert"
          />
          <el-form label-width="120px">
            <el-form-item label="消息提醒">
              <el-checkbox-group v-model="messageType">
                <el-checkbox value="1" disabled>站内信</el-checkbox>
                <el-checkbox value="2">邮件</el-checkbox>
                <el-checkbox value="3">短信</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item label="审批意见">
              <el-input v-model="approvalComment" type="textarea" :rows="3" placeholder="请输入审批意见" />
            </el-form-item>
            <el-form-item v-if="showTaskButton('copy')" label="抄送人员">
              <el-select
                v-model="copyUserIds"
                multiple
                filterable
                remote
                clearable
                :remote-method="remoteSearchUsers"
                :loading="userLoading"
                placeholder="请选择抄送人员"
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
            <template v-if="showNextNodeAssignee">
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
            </template>
          </el-form>
        </div>
      </div>
    </el-card>

    <el-dialog v-model="transferDialog.visible" title="转办" width="420px">
      <el-form label-width="90px">
        <el-form-item label="办理人">
          <el-select v-model="transferUserId" filterable remote clearable :remote-method="remoteSearchUsers" :loading="userLoading" placeholder="请选择办理人" class="w-full">
            <el-option v-for="item in userOptions" :key="item.userId" :label="`${item.nickName} (${item.userName})`" :value="item.userId" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理意见">
          <el-input v-model="approvalComment" type="textarea" :rows="3" placeholder="请输入处理意见" />
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
        <el-form-item label="处理意见">
          <el-input v-model="approvalComment" type="textarea" :rows="3" placeholder="请输入处理意见" />
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
            <el-option v-for="item in addSignatureUserOptions" :key="item.userId" :label="`${item.nickName} (${item.userName})`" :value="item.userId" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理意见">
          <el-input v-model="approvalComment" type="textarea" :rows="3" placeholder="请输入处理意见" />
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
        <el-form-item label="处理意见">
          <el-input v-model="approvalComment" type="textarea" :rows="3" placeholder="请输入处理意见" />
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
        <el-form-item label="处理意见">
          <el-input v-model="approvalComment" type="textarea" :rows="3" placeholder="请输入处理意见" />
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

  <ApprovalRecordDialog ref="approvalRecordDialogRef" />
  </div>
</template>

<style lang="scss" scoped>
.workflow-leave-edit-page {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 112px);
}

.header-card {
  flex-shrink: 0;
  margin-bottom: 16px;
}

.header-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.title-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 180px;
}

.title {
  font-size: 16px;
  font-weight: 600;
}

.subtitle {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex: 1;
  flex-wrap: wrap;
}

.action-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.action-group + .action-group {
  padding-left: 10px;
  border-left: 1px solid var(--el-border-color-lighter);
}

.form-card {
  flex: 1;
  min-height: 0;

  :deep(.el-card__body) {
    height: 100%;
    padding: 20px 24px;
  }
}

.form-scroll-area {
  height: calc(100vh - 220px);
  min-height: 420px;
  overflow-y: auto;
  padding-right: 8px;
}

.approval-panel {
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.panel-title {
  margin-bottom: 14px;
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 600;
}

.approval-alert {
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .header-wrapper {
    align-items: stretch;
    flex-direction: column;
  }

  .actions {
    justify-content: flex-start;
  }

  .action-group + .action-group {
    padding-left: 0;
    border-left: 0;
  }

  .form-scroll-area {
    height: auto;
    min-height: 0;
  }
}
</style>
