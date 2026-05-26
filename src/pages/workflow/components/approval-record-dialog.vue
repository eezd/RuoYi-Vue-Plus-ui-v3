<script lang="ts" setup>
import type { FlowHistoryTaskListResult, FlowHistoryTaskVO } from "@/common/apis/workflow/instance/types"
import { getToken } from "@@/utils/cache/cookies"
import DictTag from "@@/components/DictTag/index.vue"
import { ElMessage } from "element-plus"
import { getWorkflowInstanceHistoryTaskListApi } from "@/common/apis/workflow/instance"
import { useDict } from "@/common/composables/useDict"

export interface ApprovalRecordDialogOpenOptions {
  businessId?: string | number
  title?: string
}

defineOptions({
  name: "WorkflowApprovalRecordDialog"
})

const { wf_task_status } = toRefs<any>(useDict("wf_task_status"))

const visible = ref(false)
const loading = ref(false)
const activeTab = ref("chart")
const dialogTitle = ref("审批记录")
const historyList = ref<FlowHistoryTaskVO[]>([])
const instanceId = ref<string | number>("")
const chartUrl = ref("")

function normalizeHistoryTaskList(data?: Partial<FlowHistoryTaskListResult & {
  flowHisTaskList: FlowHistoryTaskVO[]
  hisTaskList: FlowHistoryTaskVO[]
  taskList: FlowHistoryTaskVO[]
}>) {
  return data?.list || data?.flowHisTaskList || data?.hisTaskList || data?.taskList || []
}

function buildChartUrl(id: string | number) {
  const baseUrl = String(import.meta.env.VITE_BASE_URL || "")
  const url = new URL(`${baseUrl}/warm-flow-ui/index.html`, window.location.origin)
  url.searchParams.set("id", String(id))
  url.searchParams.set("type", "FlowChart")
  url.searchParams.set("t", String(Date.now()))
  url.searchParams.set("Authorization", `Bearer ${getToken() || ""}`)
  url.searchParams.set("clientid", String(import.meta.env.VITE_APP_CLIENT_ID || ""))
  return url.toString()
}

function getHistoryTaskStatus(row: FlowHistoryTaskVO) {
  return row.flowTaskStatus || row.flowStatus || ""
}

function getHistoryStatusFallback(row: FlowHistoryTaskVO) {
  return row.flowStatusName || row.flowTaskStatus || row.flowStatus || "-"
}

function getHistoryApprover(row: FlowHistoryTaskVO) {
  return row.approverName || row.approver || row.createByName || row.createBy || "-"
}

function getHistoryMessage(row: FlowHistoryTaskVO) {
  return row.message || "-"
}

async function open(options: ApprovalRecordDialogOpenOptions) {
  if (!options.businessId) {
    ElMessage.warning("当前记录缺少业务ID，无法打开审批记录")
    return
  }

  visible.value = true
  loading.value = true
  activeTab.value = "chart"
  dialogTitle.value = options.title || "审批记录"
  historyList.value = []
  instanceId.value = ""
  chartUrl.value = ""

  try {
    const { data } = await getWorkflowInstanceHistoryTaskListApi(options.businessId)
    historyList.value = normalizeHistoryTaskList(data)
    instanceId.value = data?.instanceId || ""
    chartUrl.value = instanceId.value ? buildChartUrl(instanceId.value) : ""
    if (!chartUrl.value) {
      activeTab.value = "info"
    }
  } finally {
    loading.value = false
  }
}

defineExpose({
  open
})
</script>

<template>
  <el-dialog v-model="visible" :title="dialogTitle" width="86%" append-to-body destroy-on-close class="approval-record-dialog">
    <el-tabs v-model="activeTab" class="approval-record-tabs">
      <el-tab-pane label="流程图" name="chart">
        <div v-loading="loading" class="approval-chart-wrapper">
          <iframe v-if="chartUrl" :src="chartUrl" frameborder="0" scrolling="no" class="approval-chart-iframe" />
          <el-empty v-else description="暂无流程图" />
        </div>
      </el-tab-pane>
      <el-tab-pane label="审批信息" name="info">
        <el-table v-loading="loading" :data="historyList" border stripe empty-text="暂无审批记录" max-height="560">
          <el-table-column label="序号" type="index" width="60" align="center" />
          <el-table-column prop="nodeName" label="节点名称" align="center" min-width="120" show-overflow-tooltip />
          <el-table-column prop="targetNodeName" label="目标节点" align="center" min-width="120" show-overflow-tooltip />
          <el-table-column label="办理人" align="center" min-width="120" show-overflow-tooltip>
            <template #default="scope">
              {{ getHistoryApprover(scope.row) }}
            </template>
          </el-table-column>
          <el-table-column prop="cooperateTypeName" label="协作方式" align="center" min-width="100" show-overflow-tooltip />
          <el-table-column label="状态" align="center" min-width="100">
            <template #default="scope">
              <DictTag v-if="getHistoryTaskStatus(scope.row)" :options="wf_task_status" :value="getHistoryTaskStatus(scope.row)" />
              <span v-else class="text-placeholder">{{ getHistoryStatusFallback(scope.row) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="审批意见" align="center" min-width="180" show-overflow-tooltip>
            <template #default="scope">
              {{ getHistoryMessage(scope.row) }}
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="开始时间" align="center" min-width="160" />
          <el-table-column prop="updateTime" label="完成时间" align="center" min-width="160">
            <template #default="scope">
              {{ scope.row.updateTime || "-" }}
            </template>
          </el-table-column>
          <el-table-column prop="runDuration" label="耗时" align="center" min-width="100">
            <template #default="scope">
              {{ scope.row.runDuration || "-" }}
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </el-dialog>
</template>

<style lang="scss" scoped>
.approval-chart-wrapper {
  height: 68vh;
  min-height: 420px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-bg-color-page);
}

.approval-chart-iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: transparent;
}
</style>
