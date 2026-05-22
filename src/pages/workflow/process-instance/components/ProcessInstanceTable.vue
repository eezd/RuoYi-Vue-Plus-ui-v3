<script lang="ts" setup>
import type { PaginationData } from "@@/composables/usePagination.ts"
import type { TabsPaneContext } from "element-plus"
import type { FlowInstanceVO } from "@/common/apis/workflow/instance/types"
import DictTag from "@@/components/DictTag/index.vue"
import { Delete, Document, RefreshRight, View } from "@element-plus/icons-vue"

interface Props {
  wfBusinessStatus: DictDataOption[]
}
defineProps<Props>()

const emit = defineEmits<EmitEvents>()

/**
 * defineModel
 */
// #region defineModel
const tableData = defineModel<FlowInstanceVO[]>("tableData", { required: true })
const paginationData = defineModel<PaginationData>("paginationData", { required: true })
const loading = defineModel<boolean>("loading", { required: true })
const activeTab = defineModel<"running" | "finish">("activeTab", { required: true })
// #endregion

/**
 * EmitEvents
 */
// #region EmitEvents
export interface EmitEvents {
  handleDelete: [rows: FlowInstanceVO[]]
  handleInvalid: [row: FlowInstanceVO]
  handleView: [row: FlowInstanceVO]
  openVariableDialog: [row: FlowInstanceVO]
  handleSizeChange: [val: number]
  handleCurrentChange: [val: number]
  getTableData: []
  handleTabClick: [tab: TabsPaneContext, event: Event]
}
const handleDelete = (rows: FlowInstanceVO[]) => emit("handleDelete", rows)
const handleInvalid = (row: FlowInstanceVO) => emit("handleInvalid", row)
const handleView = (row: FlowInstanceVO) => emit("handleView", row)
const openVariableDialog = (row: FlowInstanceVO) => emit("openVariableDialog", row)
const handleSizeChange = (val: number) => emit("handleSizeChange", val)
const handleCurrentChange = (val: number) => emit("handleCurrentChange", val)
const getTableData = () => emit("getTableData")
const handleTabClick = (tab: TabsPaneContext, event: Event) => emit("handleTabClick", tab, event)
// #endregion

const selectedRows = ref<FlowInstanceVO[]>([])

function handleSelectionChange(rows: FlowInstanceVO[]) {
  selectedRows.value = rows
}
</script>

<template>
  <el-card v-loading="loading" shadow="never">
    <div class="toolbar-wrapper">
      <div class="toolbar-left">
        <el-button type="danger" plain :icon="Delete" :disabled="selectedRows.length === 0" @click="handleDelete(selectedRows)">
          删除
        </el-button>
      </div>
      <el-tooltip content="刷新当前页">
        <el-button type="primary" :icon="RefreshRight" circle @click="getTableData" />
      </el-tooltip>
    </div>

    <div class="table-wrapper">
      <el-tabs v-model="activeTab" @tab-click="handleTabClick">
        <el-tab-pane name="running" label="运行中" />
        <el-tab-pane name="finish" label="已完成" />

        <el-table :data="tableData" border @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column label="序号" type="index" width="60" align="center" />
          <el-table-column prop="businessCode" label="业务编码" align="center" min-width="130" show-overflow-tooltip />
          <el-table-column prop="businessTitle" label="业务标题" align="center" min-width="150" show-overflow-tooltip />
          <el-table-column label="流程定义名称" align="center" min-width="130">
            <template #default="scope">
              <span>{{ scope.row.flowName }} v{{ scope.row.version }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="flowCode" label="流程定义编码" align="center" min-width="120" />
          <el-table-column prop="categoryName" label="流程分类" align="center" min-width="100" />
          <el-table-column prop="nodeName" label="任务名称" align="center" min-width="100" />
          <el-table-column prop="createByName" label="申请人" align="center" min-width="100" />
          <el-table-column v-if="activeTab === 'running'" label="状态" align="center" min-width="80">
            <template #default="scope">
              <el-tag :type="scope.row.isSuspended ? 'danger' : 'success'">
                {{ scope.row.isSuspended ? "挂起" : "激活" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="流程状态" align="center" min-width="100">
            <template #default="scope">
              <DictTag :options="wfBusinessStatus" :value="scope.row.flowStatus" />
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="启动时间" align="center" min-width="160" />
          <el-table-column v-if="activeTab === 'finish'" prop="updateTime" label="结束时间" align="center" min-width="160" />
          <el-table-column label="操作" fixed="right" align="center" width="280">
            <template #default="scope">
              <el-button
                v-if="activeTab === 'running'"
                type="danger"
                text
                bg
                size="small"
                @click="handleInvalid(scope.row)"
              >
                作废
              </el-button>
              <el-button type="danger" text bg size="small" @click="handleDelete([scope.row])">
                删除
              </el-button>
              <el-button type="primary" :icon="View" text bg size="small" @click="handleView(scope.row)">
                查看
              </el-button>
              <el-button type="warning" :icon="Document" text bg size="small" @click="openVariableDialog(scope.row)">
                变量
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
</template>

<style lang="scss" scoped>
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
