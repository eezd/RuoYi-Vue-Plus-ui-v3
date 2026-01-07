<script lang="ts" setup>
import type { ClientForm, ClientQuery } from "@@/apis/admin/system/client/types.ts"
import type { FormInstance } from "element-plus"
import { delSysClientApi, getSysClientApi, getSysClientListApi } from "@@/apis/admin/system/client"
import { useDict } from "@@/composables/useDict.ts"
import { usePagination } from "@@/composables/usePagination.ts"
import { checkPermission } from "@@/utils/permission"
import { download } from "@@/utils/test.ts"
import { Delete, Refresh, Search } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { cloneDeep } from "lodash-es"
import { ref, watch } from "vue"
import ClientDialog from "./components/ClientDialog.vue"
import ClientTable from "./components/ClientTable.vue"

defineOptions({
  name: "AdminSysClient"
})

const { sys_normal_disable } = toRefs<any>(useDict("sys_normal_disable"))

const loading = ref(true)

// 表格数据
const tableData = ref<ClientForm[]>([])
// 表单数据
const formData = ref<Partial<ClientForm>>(cloneDeep({}))
// 数据弹窗
const dataDialogVisible = ref<boolean>(false)
// 数据弹窗的数据是否可编辑
const isEditableInDataDialog = ref<boolean>(true)

// 分页
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// #region 搜索栏
const searchData = reactive({
  clientKey: "",
  clientSecret: "",
  status: ""
} as ClientQuery)
const searchFormRef = ref<FormInstance | null>(null)
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
    const { rows, total } = await getSysClientListApi({
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
async function handleDelete(row: ClientForm | ClientForm[]) {
  const items = Array.isArray(row) ? row : [row]
  const deleteIds = items.map(item => item.id)
  const message = Array.isArray(row)
    ? `正在删除 ${row.length} 条数据，确认删除？`
    : `正在删除：${row.clientKey}，确认删除？`

  try {
    await ElMessageBox.confirm(message, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
    loading.value = true
    const res = await delSysClientApi(deleteIds)
    ElMessage.success(res.msg)
    await getTableData()
  } catch {
  } finally {
    loading.value = false
  }
}

/**
 * 导出
 */
function handleExport() {
  const timestamp = new Date().getTime()
  download(
    "/system/client/export",
    { ...searchData },
    `client_${timestamp}.xlsx`
  )
}

/**
 * 打开新增弹窗
 */
function openAddDialog() {
  formData.value = cloneDeep({})
  isEditableInDataDialog.value = true
  dataDialogVisible.value = true
}

/**
 * 打开修改弹窗
 *
 * @param row
 */
async function openUpdateDialog(row: ClientForm) {
  loading.value = true
  isEditableInDataDialog.value = true
  dataDialogVisible.value = true
  try {
    formData.value = cloneDeep({})
    const { data } = await getSysClientApi(row.id)
    formData.value = data as ClientForm
  } finally {
    loading.value = false
  }
}

/**
 * 打开查看弹窗
 *
 * @param row
 */
async function openShowDialog(row: ClientForm) {
  loading.value = true
  isEditableInDataDialog.value = false
  dataDialogVisible.value = true
  try {
    formData.value = cloneDeep({})
    const { data } = await getSysClientApi(row.id)
    formData.value = data as ClientForm
  } finally {
    loading.value = false
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
        <el-form-item prop="clientKey" label="客户端key">
          <el-input v-model="searchData.clientKey" placeholder="请输入客户端key" @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item prop="clientSecret" label="客户端秘钥">
          <el-input v-model="searchData.clientSecret" placeholder="请输入客户端秘钥" @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item prop="status" label="状态">
          <el-select class="min-w-[150px]" v-model="searchData.status" placeholder="状态" clearable>
            <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
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
    <ClientTable
      v-model:loading="loading"
      v-model:table-data="tableData"
      v-model:pagination-data="paginationData"
      @open-add-dialog="openAddDialog"
      @get-table-data="getTableData"
      @handle-delete="handleDelete"
      @handle-export="handleExport"
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
                <el-dropdown-item @click="openUpdateDialog(scope.row)" :disabled="!checkPermission(['system:client:edit'])">
                  <el-icon color="#409EFF">
                    <edit />
                  </el-icon>
                  修改
                </el-dropdown-item>
                <el-dropdown-item @click="handleDelete(scope.row)" :disabled="!checkPermission(['system:client:remove'])">
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
    </ClientTable>

    <!-- 数据弹窗 -->
    <ClientDialog
      v-model:loading="loading"
      v-model:data-dialog-visible="dataDialogVisible"
      v-model:is-editable="isEditableInDataDialog"
      v-model:form-data="formData"
      @get-table-data="getTableData"
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
