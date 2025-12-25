<script lang="ts" setup>
import type { FormInstance } from "element-plus"
import type { ConfigForm, ConfigQuery } from "@/common/apis/admin/system/config/types"
import { usePagination } from "@@/composables/usePagination"
import { Delete, Refresh, Search } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { cloneDeep } from "lodash-es"
import { ref, watch } from "vue"
import { delConfigApi, getSysConfigApi, getSysConfigListApi } from "@/common/apis/admin/system/config"
import { useDict } from "@/common/composables/useDict"
import { download } from "@/common/utils/test"
import ConfigDialog from "./components/ConfigDialog.vue"
import ConfigTable from "./components/ConfigTable.vue"

defineOptions({
  name: "AdminSysConfig"
})

const { sys_yes_no } = toRefs<any>(useDict("sys_yes_no"))

const loading = ref(true)
// 表格数据
const tableData = ref<ConfigForm[]>([])
// 表单数据
const formData = ref<Partial<ConfigForm>>(cloneDeep({}))
// 数据弹窗
const dataDialogVisible = ref<boolean>(false)
// 数据弹窗的数据是否可编辑
const isEditableInDataDialog = ref<boolean>(true)

// 分页
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// #region 搜索栏
const searchData = reactive({
  configName: "",
  configKey: "",
  configType: "",
  params: {
    beginTime: undefined,
    endTime: undefined
  }
} as ConfigQuery)
const searchFormRef = ref<FormInstance | null>(null)

const dateRange = ref<[DateModelType, DateModelType]>(["", ""])
watch(dateRange, ([newBeginTime, newEndTime]) => {
  searchData.params = {}
  searchData.params.beginTime = newBeginTime.toLocaleString()
  searchData.params.endTime = newEndTime.toLocaleString()
})

function resetSearch() {
  searchFormRef.value?.resetFields()
  dateRange.value = ["", ""]
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
    const { rows, total } = await getSysConfigListApi({
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
async function handleDelete(row: ConfigForm | ConfigForm[]) {
  const items = Array.isArray(row) ? row : [row]
  const deleteIds = items.map(item => item.configId)
  const message = Array.isArray(row)
    ? `正在删除 ${row.length} 条数据，确认删除？`
    : `正在删除：${row.configName}，确认删除？`

  try {
    await ElMessageBox.confirm(message, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
    loading.value = true
    const res = await delConfigApi(deleteIds)
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
    "/system/Config/type/export",
    { ...searchData },
    `Config_${timestamp}.xlsx`
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
async function openUpdateDialog(row: ConfigForm) {
  loading.value = true
  isEditableInDataDialog.value = true
  dataDialogVisible.value = true
  try {
    formData.value = cloneDeep({})
    const { data } = await getSysConfigApi(row.configId)
    formData.value = data as ConfigForm
  } finally {
    loading.value = false
  }
}

/**
 * 打开查看弹窗
 *
 * @param row
 */
async function openShowDialog(row: ConfigForm) {
  loading.value = true
  isEditableInDataDialog.value = false
  dataDialogVisible.value = true
  try {
    formData.value = cloneDeep({})
    const { data } = await getSysConfigApi(row.configId)
    formData.value = data as ConfigForm
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
        <el-form-item prop="configName" label="参数名称">
          <el-input v-model="searchData.configName" placeholder="请输入参数名称" @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item prop="configKey" label="参数键名">
          <el-input v-model="searchData.configKey" placeholder="请输入参数键名" @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item prop="configType" label="系统内置">
          <el-select class="min-w-[150px]" v-model="searchData.configType" placeholder="系统内置" clearable>
            <el-option v-for="dict in sys_yes_no" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间" style="width: 308px">
          <el-date-picker
            v-model="dateRange"
            value-format="YYYY-MM-DD HH:mm:ss"
            type="daterange"
            range-separator="-"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
          />
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
    <ConfigTable
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
                <el-dropdown-item @click="openUpdateDialog(scope.row)">
                  <el-icon color="#409EFF">
                    <edit />
                  </el-icon>
                  修改
                </el-dropdown-item>
                <el-dropdown-item @click="handleDelete(scope.row)">
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
    </ConfigTable>

    <!-- 数据弹窗 -->
    <ConfigDialog
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
