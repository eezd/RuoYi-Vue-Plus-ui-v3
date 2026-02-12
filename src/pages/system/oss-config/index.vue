<script lang="ts" setup>
import type { OssConfigForm, OssConfigQuery } from "@@/apis/system/ossConfig/types"
import { delSysOssConfigApi, getSysOssConfigApi, getSysOssConfigListApi } from "@@/apis/system/ossConfig"
import { usePagination } from "@@/composables/usePagination.ts"
import { checkPermission } from "@@/utils/permission"
import { Delete, Refresh, Search } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { cloneDeep } from "lodash-es"
import { ref, watch } from "vue"
import OssConfigDialog from "./components/OssConfigDialog.vue"
import OssConfigTable from "./components/OssConfigTable.vue"

defineOptions({
  name: "AdminSysOssConfig"
})

const loading = ref(true)
// 表格数据
const tableData = ref<OssConfigForm[]>([])
const DEFAULT_FORM_DATA = { status: "1", isHttps: "N", accessPolicy: "1" }
// 表单数据
const formData = ref<Partial<OssConfigForm>>(cloneDeep(DEFAULT_FORM_DATA))
const dialog = reactive<DialogOption>({
  title: "",
  visible: false,
  loading: false,
  isEditable: false
})

// 分页
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// #region 搜索栏
const searchData = reactive({
  configKey: "",
  bucketName: "",
  status: ""
} as OssConfigQuery)
const searchFormRef = useTemplateRef("searchFormRef")
function resetSearch() {
  searchFormRef.value?.resetFields()
  getTableData()
}
// #endregion

// #region 表单操作
/**
 * 获取数据
 */
async function getTableData(): Promise<void> {
  try {
    loading.value = true
    const { rows, total } = await getSysOssConfigListApi({
      ...searchData,
      pageNum: paginationData.currentPage,
      pageSize: paginationData.pageSize
    })
    tableData.value = rows
    paginationData.total = total
  } catch {
    tableData.value = []
  } finally {
    loading.value = false
  }
}

/**
 * 删除
 */
async function handleDelete(row: OssConfigForm | OssConfigForm[]) {
  const items = Array.isArray(row) ? row : [row]
  const deleteIds = items.map(item => item.ossConfigId)
  const message = Array.isArray(row)
    ? `正在删除 ${row.length} 条数据，确认删除？`
    : `正在删除：${row.configKey}，确认删除？`

  try {
    await ElMessageBox.confirm(message, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
    loading.value = true
    const res = await delSysOssConfigApi(deleteIds)
    ElMessage.success(res.msg)
    await getTableData()
  } catch {
  } finally {
    loading.value = false
  }
}
// #endregion

// #region 弹窗操作
/**
 * 打开新增弹窗
 */
function openAddDialog() {
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
  dialog.title = "新增对象存储配置"
  dialog.isEditable = true
  dialog.visible = true
}

/**
 * 打开修改弹窗
 *
 * @param row
 */
async function openUpdateDialog(row: OssConfigForm) {
  dialog.loading = true
  dialog.title = "修改对象存储配置"
  dialog.isEditable = true
  dialog.visible = true
  try {
    formData.value = cloneDeep({})
    const { data } = await getSysOssConfigApi(row.ossConfigId)
    formData.value = data as OssConfigForm
  } finally {
    dialog.loading = false
  }
}

/**
 * 打开查看弹窗
 *
 * @param row
 */
async function openShowDialog(row: OssConfigForm) {
  dialog.loading = true
  dialog.title = "查看对象存储配置"
  dialog.isEditable = false
  dialog.visible = true
  try {
    formData.value = cloneDeep({})
    const { data } = await getSysOssConfigApi(row.ossConfigId)
    formData.value = data as OssConfigForm
  } finally {
    dialog.loading = false
  }
}
// #endregion

// #region 监听
/**
 * 监听分页参数的变化
 */
watch(
  [() => paginationData.currentPage, () => paginationData.pageSize],
  () => {
    getTableData()
  }
)
// #endregion

onMounted(async () => {
  await getTableData()
  loading.value = false
})
</script>

<template>
  <div class="app-container">
    <!-- 查询表单 -->
    <el-card v-loading="loading" shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item prop="configKey" label="配置key">
          <el-input v-model="searchData.configKey" placeholder="请输入配置key" @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item prop="bucketName" label="桶名称">
          <el-input v-model="searchData.bucketName" placeholder="请输入桶名称" @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item prop="status" label="是否默认">
          <el-select v-model="searchData.status" placeholder="请选择状态" clearable>
            <el-option key="0" label="是" value="0" />
            <el-option key="1" label="否" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="getTableData">
            查询
          </el-button>
          <el-button :icon="Refresh" @click="resetSearch">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格 -->
    <OssConfigTable
      v-model:loading="loading"
      v-model:table-data="tableData"
      v-model:pagination-data="paginationData"
      @open-add-dialog="openAddDialog"
      @get-table-data="getTableData"
      @handle-delete="handleDelete"
      @handle-current-change="handleCurrentChange"
      @handle-size-change="handleSizeChange"
    >
      <template #operation="{ scope }">
        <div style="display: flex; align-items: center; gap: 10px">
          <el-button
            type="primary"
            :icon="Search"
            text
            bg
            size="small"
            @click="openShowDialog(scope.row)"
          >
            查看
          </el-button>
          <el-dropdown trigger="hover">
            <span class="el-dropdown-link">
              <el-icon color="#409EFF"><more-filled /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="openUpdateDialog(scope.row)" v-if="checkPermission(['system:dict:edit'])">
                  <el-icon color="#409EFF">
                    <edit />
                  </el-icon>
                  修改
                </el-dropdown-item>
                <el-dropdown-item @click="handleDelete(scope.row)" v-if="checkPermission(['system:dict:remove'])">
                  <el-icon color="#F56C6C">
                    <Delete />
                  </el-icon>
                  删除
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </template>
    </OssConfigTable>

    <!-- 数据弹窗 -->
    <OssConfigDialog
      v-model:dialog="dialog"
      v-model:form-data="formData"
      @success="getTableData"
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
