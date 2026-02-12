<script lang="ts" setup>
import type { UserForm, UserVO } from "@@/apis/system/user/types.ts"
import type { PaginationData } from "@@/composables/usePagination.ts"
import { changeSysUserStatusApi } from "@@/apis/system/user"
import { useDevice } from "@@/composables/useDevice.ts"
import { formatDateTime } from "@@/utils"
import { checkPermission } from "@@/utils/permission"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { globalHeaders } from "@/http/axios"
import { download } from "@/http/download"

const emit = defineEmits<EmitEvents>()
/**
 * defineModel
 */
// #region defineModel
const tableData = defineModel<UserVO[]>("tableData", { required: true })
const paginationData = defineModel<PaginationData>("paginationData", { required: true })
const loading = defineModel<boolean>("loading", { required: true })
// #endregion

/**
 * EmitEvents
 */
// #region EmitEvents
export interface EmitEvents {
  openAddDialog: []
  handleDelete: [rows: UserForm[]]
  handleExport: []
  handleSizeChange: [val: number]
  handleCurrentChange: [val: number]
  getTableData: []
}
const openAddDialog = () => emit("openAddDialog")
const handleDelete = (rows: UserForm[]) => emit("handleDelete", rows)
const handleExport = () => emit("handleExport")
const handleSizeChange = (val: number) => emit("handleSizeChange", val)
const handleCurrentChange = (val: number) => emit("handleCurrentChange", val)
const getTableData = () => emit("getTableData")
// #endregion

const { isMobile } = useDevice()

const selectedRows = ref<UserForm[]>([])

const handleSelectionChange = (val: UserForm[]) => (selectedRows.value = val)

async function handleStatusChange(row: UserForm) {
  const text = row.status === "0" ? "启用" : "停用"
  try {
    await ElMessageBox.confirm(`确认要"${text}""${row.userName}"吗?`, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
    await changeSysUserStatusApi(row.userId, row.status)
    ElMessage.success(`${text}成功`)
  } catch {
    row.status = row.status === "0" ? "1" : "0"
  }
}

/**
 * 导出
 */
function importTemplate() {
  const timestamp = new Date().getTime()
  download(
    "/system/user/importTemplate",
    { },
    `user_template_${timestamp}.xlsx`
  )
}

// #region 用户导入
const uploadRef = useTemplateRef("uploadRef")
/** 用户导入 */
const uploadData = reactive<ImportOption>({
  // 弹出层标题
  title: "用户导入",
  // 是否显示弹出层
  visible: false,
  // 上传状态
  loading: false,
  // 是否更新已经存在的用户数据
  updateSupport: 0,
  // 设置上传的请求头部
  headers: globalHeaders(),
  // 上传的地址
  url: `${import.meta.env.VITE_BASE_URL}/system/user/importData`
})

/** 导入按钮操作 */
function handleImport() {
  uploadData.title = "用户导入"
  uploadData.visible = true
}

/** 文件上传中处理 */
function handleFileUploadProgress() {
  uploadData.loading = true
}

/** 文件上传成功处理 */
function handleFileSuccess(response: any, file: UploadFile) {
  uploadData.visible = false
  uploadData.loading = false
  uploadRef.value?.handleRemove(file)
  ElMessageBox.alert(`<div style='overflow: auto;overflow-x: hidden;max-height: 70vh;padding: 10px 20px 0;'>${response.msg}</div>`, "导入结果", {
    dangerouslyUseHTMLString: true
  })
  getTableData()
}

/** 提交上传文件 */
function submitFileForm() {
  uploadRef.value?.submit()
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
        <el-dropdown class="ml-[12px]">
          <el-button plain type="info">
            更多
            <el-icon class="el-icon--right">
              <arrow-down />
            </el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item icon="Download" @click="importTemplate">
                下载模板
              </el-dropdown-item>
              <!-- 注意 由于el-dropdown-item标签是延迟加载的 所以v-has-permi自定义标签不生效 需要使用v-if调用方法执行 -->
              <el-dropdown-item v-if="checkPermission(['system:user:import'])" icon="Top" @click="handleImport">
                导入数据
              </el-dropdown-item>
              <el-dropdown-item v-if="checkPermission(['system:user:export'])" icon="Download" @click="handleExport">
                导出数据
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <div>
        <el-tooltip content="刷新当前页">
          <el-button type="primary" :icon="RefreshRight" circle @click="() => getTableData()" />
        </el-tooltip>
      </div>
    </div>
    <div class="table-wrapper">
      <el-table :data="tableData" @selection-change="handleSelectionChange" border>
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column prop="userName" label="用户名称" align="center" />
        <el-table-column prop="nickName" label="用户昵称" align="center" />
        <el-table-column prop="deptName" label="部门" align="center" />
        <el-table-column prop="phonenumber" label="手机号码" align="center" />
        <el-table-column prop="status" label="状态" align="center">
          <template #default="scope">
            <el-switch v-model="scope.row.status" active-value="0" inactive-value="1" v-hasPermi="['system:user:edit']" @change="handleStatusChange(scope.row)" />
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

  <el-dialog v-model="uploadData.visible" :title="uploadData.title" @closed="uploadData.visible = false" destroy-on-close append-to-bod width="350px">
    <el-upload
      ref="uploadRef"
      :limit="1"
      accept=".xlsx, .xls"
      :headers="uploadData.headers"
      :action="`${uploadData.url}?updateSupport=${uploadData.updateSupport}`"
      :disabled="uploadData.isUploading"
      :on-progress="handleFileUploadProgress"
      :on-success="handleFileSuccess"
      :auto-upload="false"
      drag
    >
      <el-icon class="el-icon--upload">
        <Upload />
      </el-icon>
      <div class="el-upload__text">
        将文件拖到此处，或<em>点击上传</em>
      </div>
      <template #tip>
        <div class="text-center el-upload__tip">
          <div class="el-upload__tip">
            <el-checkbox v-model="uploadData.updateSupport" />是否更新已经存在的用户数据
          </div>
          <span>仅允许导入xls、xlsx格式文件。</span>
          <el-link type="primary" underline="never" style="font-size: 12px; vertical-align: baseline" @click="importTemplate">
            下载模板
          </el-link>
        </div>
      </template>
    </el-upload>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="submitFileForm" :loading="uploadData.loading">
          确 定
        </el-button>
        <el-button @click="uploadData.visible = false">
          取 消
        </el-button>
      </div>
    </template>
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
