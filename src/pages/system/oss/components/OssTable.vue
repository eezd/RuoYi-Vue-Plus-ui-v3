<script lang="ts" setup>
import type { OssVO } from "@@/apis/system/oss/types"
import type { PaginationData } from "@@/composables/usePagination.ts"
import type { FormRules } from "element-plus"
import { updateSysConfigByKeyApi } from "@@/apis/system/config"
import FileUpload from "@@/components/FileUpload/index.vue"
import ImagePreview from "@@/components/ImagePreview/index.vue"
import ImageUpload from "@@/components/ImageUpload/index.vue"
import { useDevice } from "@@/composables/useDevice.ts"
import { formatDateTime } from "@@/utils"
import { checkPermission } from "@@/utils/permission"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { ref } from "vue"

const emit = defineEmits<EmitEvents>()
/**
 * defineModel
 */
// #region defineModel
const tableData = defineModel<OssVO[]>("tableData", { required: true })
const paginationData = defineModel<PaginationData>("paginationData", { required: true })
const loading = defineModel<boolean>("loading", { required: true })
const previewListResource = defineModel<boolean>("previewListResource", { required: true })
// #endregion

/**
 * EmitEvents
 */
// #region EmitEvents
export interface EmitEvents {
  handleDelete: [rows: OssVO[]]
  handleSizeChange: [val: number]
  handleCurrentChange: [val: number]
  getTableData: []
}
const handleDelete = (rows: OssVO[]) => emit("handleDelete", rows)
const handleSizeChange = (val: number) => emit("handleSizeChange", val)
const handleCurrentChange = (val: number) => emit("handleCurrentChange", val)
const getTableData = () => emit("getTableData")
// #endregion

const { isMobile } = useDevice()
const router = useRouter()

const selectedRows = ref<OssVO[]>([])

const handleSelectionChange = (val: OssVO[]) => (selectedRows.value = val)

function handleOssConfig() {
  router.push("/admin/system/oss-config")
}

const formRef = ref<ElFormInstance>()
const type = ref(0)
const dialog = reactive<any>({
  visible: false,
  title: ""
})
const formData = ref<Partial<any>>({})
const formRules: FormRules<any> = {
  file: [{ required: true, message: "文件不能为空", trigger: "blur" }]
}
function handleFile() {
  formData.value = { file: "" }
  formRef.value?.resetFields()
  type.value = 0
  dialog.visible = true
  dialog.title = "上传文件"
}

function handleImage() {
  formData.value = { file: "" }
  formRef.value?.resetFields()
  type.value = 1
  dialog.visible = true
  dialog.title = "上传图片"
}
async function handleSubmit() {
  formRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      await getTableData()
      dialog.visible = false
    }
  })
}

function handleDialogClosed() {
  formData.value = { file: "" }
}

function checkFileSuffix(fileSuffix: string | string[]) {
  const arr = [".png", ".jpg", ".jpeg"]
  const suffixArray = Array.isArray(fileSuffix) ? fileSuffix : [fileSuffix]
  return suffixArray.some(suffix => arr.includes(suffix.toLowerCase()))
}

async function handlePreviewListResource(preview: boolean) {
  const text = preview ? "启用" : "停用"
  try {
    await ElMessageBox.confirm(`确认要" ${text} "预览列表图片"配置吗?`, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
    await updateSysConfigByKeyApi("sys.oss.previewListResource", preview)
    await getTableData()
    await ElMessage.success(`${text}成功`)
  } catch {
  }
}
</script>

<template>
  <el-card v-loading="loading" shadow="never">
    <div class="toolbar-wrapper">
      <div :style="isMobile ? 'display:flex; gap: 10px; flex-wrap: wrap;' : ''">
        <el-button type="primary" plain icon="Upload" @click="handleFile">
          上传文件
        </el-button>
        <el-button
          type="primary"
          :icon="CirclePlus"
          :disabled="!checkPermission(['system:role:add'])"
          @click="handleImage()"
        >
          上传图片
        </el-button>
        <el-button
          type="danger" plain icon="Delete"
          :disabled="!selectedRows.length || !checkPermission(['system:role:remove'])"
          @click="handleDelete(selectedRows)"
        >
          批量删除
        </el-button>
        <el-button
          :type="previewListResource ? 'danger' : 'warning'"
          plain
          @click="handlePreviewListResource(!previewListResource)"
        >
          预览开关 : {{ previewListResource ? '禁用' : '启用' }}
        </el-button>
        <el-button
          type="warning" plain icon="Operation"
          @click="handleOssConfig()"
        >
          配置管理
        </el-button>
      </div>
      <div>
        <el-tooltip content="刷新当前页">
          <el-button type="primary" :icon="RefreshRight" circle @click="() => getTableData()" />
        </el-tooltip>
      </div>
    </div>
    <div class="table-wrapper">
      <el-table :data="tableData" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column prop="fileName" label="文件名" align="center" />
        <el-table-column prop="originalName" label="原名" align="center" />
        <el-table-column prop="fileSuffix" label="文件后缀" align="center" />
        <el-table-column prop="fileName" label="文件名" align="center" />
        <el-table-column prop="url" label="文件展示" align="center">
          <template #default="scope">
            <ImagePreview
              v-if="previewListResource && checkFileSuffix(scope.row.fileSuffix)"
              :width="100"
              :height="100"
              :src="scope.row.url"
              :preview-src-list="[scope.row.url]"
            />
            <span v-if="!checkFileSuffix(scope.row.fileSuffix) || !previewListResource" v-text="scope.row.url" />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" min-width="180">
          <template #default="scope">
            <span>{{ formatDateTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="上传人" align="center" prop="createByName" />
        <el-table-column label="服务商" align="center" prop="service" sortable="custom" />
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
  {{ formData }}
  <!-- 添加或修改OSS对象存储对话框 -->
  <el-dialog v-model="dialog.visible" @closed="handleDialogClosed" :title="dialog.title" width="500px" append-to-body>
    {{ formData }}
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
      <el-form-item label="文件名">
        <FileUpload v-if="type === 0" v-model:file-ids="formData.file" />
        <ImageUpload v-if="type === 1" v-model:file-ids="formData.file" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button :loading="loading" type="primary" @click="handleSubmit">
          确 定
        </el-button>
        <el-button @click="dialog.visible = false">
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
