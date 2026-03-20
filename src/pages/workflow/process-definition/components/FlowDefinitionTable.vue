<script lang="ts" setup>
import type { PaginationData } from "@@/composables/usePagination.ts"
import type { TabsPaneContext, UploadRequestOptions } from "element-plus"
import type { CategoryTreeVO } from "@/common/apis/workflow/category/types"
import type { FlowDefinitionVO } from "@/common/apis/workflow/definition/types"
import { useDevice } from "@@/composables/useDevice.ts"
import { formatDateTime } from "@@/utils"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { activeWorkflowDefinitionApi, importWorkflowDefinitionApi } from "@/common/apis/workflow/definition"
import { download } from "@/http/download"

interface Props {
  treeOptions: CategoryTreeVO[]
}
const { treeOptions } = defineProps<Props>()

const emit = defineEmits<EmitEvents>()

/**
 * defineModel
 */
// #region defineModel
const tableData = defineModel<FlowDefinitionVO[]>("tableData", { required: true })
const paginationData = defineModel<PaginationData>("paginationData", { required: true })
const loading = defineModel<boolean>("loading", { required: true })
const activeName = defineModel<string>("activeName", { required: true })
// #endregion

/**
 * EmitEvents
 */
// #region EmitEvents
export interface EmitEvents {
  openAddDialog: []
  handleDelete: [rows: FlowDefinitionVO[]]
  handleSizeChange: [val: number]
  handleCurrentChange: [val: number]
  getTableData: []
  handleTabClick: [tab: TabsPaneContext, event: Event]
}
const openAddDialog = () => emit("openAddDialog")
const handleDelete = (rows: FlowDefinitionVO[]) => emit("handleDelete", rows)
const handleSizeChange = (val: number) => emit("handleSizeChange", val)
const handleCurrentChange = (val: number) => emit("handleCurrentChange", val)
const getTableData = () => emit("getTableData")
const handleTabClick = (tab: TabsPaneContext, event: Event) => emit("handleTabClick", tab, event)
// #endregion

const { isMobile } = useDevice()

const selectedRows = ref<FlowDefinitionVO[]>([])

const handleSelectionChange = (val: FlowDefinitionVO[]) => (selectedRows.value = val)

async function handleStatusChange(row: FlowDefinitionVO) {
  let msg: string
  if (row.activityStatus === 0) {
    msg = `暂停后，此流程下的所有任务都不允许往后流转，您确定挂起【${row.flowName || row.flowCode}】吗？`
  } else {
    msg = `启动后，此流程下的所有任务都允许往后流转，您确定激活【${row.flowName || row.flowCode}】吗？`
  }
  try {
    await ElMessageBox.confirm(msg, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
    await activeWorkflowDefinitionApi(row.id, !!row.activityStatus)
    ElMessage.success(`操作成功`)
  } catch {
    row.activityStatus = row.activityStatus === 0 ? 1 : 0
  }
}

/**
 * 导出
 */
function handleExport() {
  const timestamp = new Date().getTime()
  download(
    `/workflow/definition/exportDef/${selectedRows.value[0].id}`,
    {},
    `${selectedRows.value[0].id}-${timestamp}.json`
  )
}

// #region 部署文件
const uploadDialog = reactive<DialogOption>({
  title: "",
  visible: false,
  loading: false,
  isEditable: false
})
const uploadDialogLoading = ref(false)
const selectCategory = ref()
function handlerImportDefinition(data: UploadRequestOptions): any {
  const formData = new FormData()
  uploadDialogLoading.value = true
  formData.append("file", data.file)
  formData.append("category", selectCategory.value)
  importWorkflowDefinitionApi(formData)
    .then(() => {
      uploadDialog.visible = false
      ElMessage.success("部署成功")
      activeName.value = "1"
      getTableData()
    })
    .finally(() => {
      uploadDialogLoading.value = false
    })
}
// 上传文件前的钩子
function handlerBeforeUpload() {
  if (selectCategory.value === "ALL") {
    ElMessage.error("顶级节点不可作为分类！")
    return false
  }
  if (!selectCategory.value) {
    ElMessage.error("请选择左侧要上传的分类！")
    return false
  }
}

// #endregion
</script>

<template>
  <el-card v-loading="loading" shadow="never">
    <div class="toolbar-wrapper">
      <div :style="isMobile ? 'display:flex; gap: 10px; flex-wrap: wrap;' : ''">
        <el-button
          type="primary"
          :icon="CirclePlus"
          v-hasPermi="['system:user:add']"
          @click="openAddDialog()"
        >
          新增
        </el-button>
        <el-button
          type="danger" plain icon="Delete"
          :disabled="!selectedRows.length"
          v-hasPermi="['system:user:remove']"
          @click="handleDelete(selectedRows)"
        >
          批量删除
        </el-button>
        <el-button
          type="warning" plain icon="Download"
          @click="uploadDialog.visible = true"
        >
          部署流程文件
        </el-button>
        <el-button
          type="warning" plain icon="Download"
          :disabled="selectedRows.length !== 1"
          @click="handleExport()"
        >
          导出
        </el-button>
      </div>
      <div>
        <el-tooltip content="刷新当前页">
          <el-button type="primary" :icon="RefreshRight" circle @click="() => getTableData()" />
        </el-tooltip>
      </div>
    </div>
    <div class="table-wrapper">
      <el-tabs v-model="activeName" class="demo-tabs" @tab-click="handleTabClick">
        <el-tab-pane label="已发布" name="0" />
        <el-tab-pane label="未发布" name="1" />

        <el-table :data="tableData" @selection-change="handleSelectionChange" border>
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="flowName" label="流程定义名称" align="center" />
          <el-table-column prop="flowCode" label="标识KEY" align="center" />
          <el-table-column prop="categoryName" label="流程分类" align="center" />

          <el-table-column align="center" prop="version" label="版本号" width="80">
            <template #default="scope">
              v{{ scope.row.version }}.0
            </template>
          </el-table-column>

          <el-table-column prop="activityStatus" label="状态" align="center">
            <template #default="scope">
              <el-switch v-model="scope.row.activityStatus" :active-value="0" :inactive-value="1" @change="handleStatusChange(scope.row)" />
            </template>
          </el-table-column>

          <el-table-column align="center" prop="isPublish" label="发布状态" width="100">
            <template #default="scope">
              <el-tag v-if="scope.row.isPublish === 0" type="danger">
                未发布
              </el-tag>
              <el-tag v-else-if="scope.row.isPublish === 1" type="success">
                已发布
              </el-tag>
              <el-tag v-else type="danger">
                失效
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="创建时间" align="center" prop="createTime" width="160">
            <template #default="scope">
              <span>{{ formatDateTime(scope.row.createTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column fixed="right" label="操作" :width="isMobile ? 100 : 130" align="center">
            <template #default="scope">
              <slot name="operation" :scope="scope" />
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
        :page-size="paginationData.pageSize"
        :current-page="paginationData.currentPage"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </el-card>

  <!-- 部署文件 -->
  <el-dialog v-if="uploadDialog.visible" v-model="uploadDialog.visible" :title="uploadDialog.title" width="30%">
    <div v-loading="uploadDialogLoading">
      <div class="mb5">
        <el-text class="mx-1" size="large">
          <span class="text-danger">*</span>请选择部署流程分类：
        </el-text>
        <el-tree-select
          v-model="selectCategory"
          :data="treeOptions"
          :props="{ value: 'id', label: 'label', children: 'children' } as any"
          filterable
          value-key="id"
          :render-after-expand="false"
          check-strictly
          style="width: 240px"
        />
      </div>
      <el-upload
        class="upload-demo"
        drag
        multiple
        accept="application/json,application/text"
        :before-upload="handlerBeforeUpload"
        :http-request="handlerImportDefinition"
      >
        <el-icon class="UploadFilled">
          <upload-filled />
        </el-icon>
        <div class="el-upload__text">
          <em>点击上传，选择JSON流程文件</em>
        </div>
        <div class="el-upload__text">
          仅支持json格式文件
        </div>
        <div class="el-upload__text">
          PS:如若部署请部署从本项目模型管理导出的数据
        </div>
      </el-upload>
    </div>
  </el-dialog>
</template>

<style lang="scss" scoped>
.toolbar-wrapper {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.table-wrapper {
  margin-bottom: 20px;
}

.pager-wrapper {
  display: flex;
  justify-content: flex-end;
}
</style>
