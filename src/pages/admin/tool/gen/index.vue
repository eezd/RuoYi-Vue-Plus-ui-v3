<script lang="ts" setup>
import type { FormInstance } from "element-plus"
import type { TableQuery, TableVO } from "@/common/apis/admin/tool/gen/types"
import { usePagination } from "@@/composables/usePagination.ts"
import { checkPermission } from "@@/utils/permission"
import { Delete, Refresh, Search } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { cloneDeep } from "lodash-es"
import { ref, watch } from "vue"
import { delSysGenTable, genSysGenCode, getSysGenDataNames, getSysGenListApi, previewSysGenTable, synchSysGenDb } from "@/common/apis/admin/tool/gen"
import { downloadZip } from "@/http/download"
import DataDialog from "./components/DataDialog.vue"
import DataTable from "./components/DataTable.vue"
import ImportDialog from "./components/ImportDialog.vue"

defineOptions({
  name: "AdminSysConfig"
})

const router = useRouter()

const loading = ref(true)
// 表格数据
const tableData = ref<TableVO[]>([])
// 表单数据
const formData = ref<{
  data: Record<string, string>
  activeName: string
}>({
  data: {},
  activeName: "domain.java"
})

const dialog = reactive<DialogOption>({
  title: "",
  visible: false,
  loading: false,
  isEditable: false
})

// 导入弹窗
const dialogImport = reactive<DialogOption>({
  title: "",
  visible: false,
  loading: false,
  isEditable: false
})

// 分页
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// #region 搜索栏
const searchData = reactive({
  tableName: "",
  tableComment: "",
  dataName: "",
  params: {
    beginTime: undefined,
    endTime: undefined
  }
} as TableQuery)
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

const dataNameList = ref<Array<string>>([])
/** 查询多数据源名称 */
async function getDataNameList() {
  const res = await getSysGenDataNames()
  dataNameList.value = res.data
}

// #endregion

// #region 表单操作
/**
 * 获取数据
 */
async function getTableData(): Promise<void> {
  try {
    loading.value = true
    const { rows, total } = await getSysGenListApi({
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
async function handleDelete(row: TableVO | TableVO[]) {
  const items = Array.isArray(row) ? row : [row]
  const deleteIds = items.map(item => item.tableId)
  const message = Array.isArray(row)
    ? `正在删除 ${row.length} 条数据，确认删除？`
    : `正在删除：${row.tableName}，确认删除？`

  try {
    await ElMessageBox.confirm(message, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
    loading.value = true
    const res = await delSysGenTable(deleteIds)
    ElMessage.success(res.msg)
    await getTableData()
  } catch {
  } finally {
    loading.value = false
  }
}

/**
 * 修改
 */
function handleUpdate(row: TableVO) {
  const tableId = row?.tableId
  router.push({ path: `/admin/tool/gen-edit/${tableId}`, query: { pageNum: searchData.pageNum } })
}

/** 生成代码操作 */
async function handleGenTable(row: TableVO) {
  const tbIds = row?.tableId
  if (tbIds === "") {
    ElMessage.error("未选择任何表")
    return
  }
  if (row?.genType === "1") {
    await genSysGenCode(row.tableId)
    ElMessage.success(`成功生成到自定义路径：${row.genPath}`)
  } else {
    downloadZip(`/tool/gen/batchGenCode?tableIdStr=${tbIds}`, "ruoyi.zip")
  }
}

/**
 * 同步数据库操作
 */
async function handleSynchDb(row: TableVO) {
  const tableId = row.tableId
  await ElMessageBox.confirm(
    `确认要强制同步"${row.tableName}"表结构吗？`,
    "提示",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }
  )
  loading.value = true
  await synchSysGenDb(tableId)
  loading.value = false
  ElMessage.success("同步成功")
}
// #endregion

// #region 弹窗操作

/**
 * 打开查看弹窗
 *
 * @param row
 */
async function openShowDialog(row: TableVO) {
  dialog.loading = true
  dialog.title = "查看"
  dialog.isEditable = false
  dialog.visible = true
  try {
    formData.value.data = cloneDeep({})
    const { data } = await previewSysGenTable(row.tableId)
    formData.value.data = data
    formData.value.activeName = "domain.java"
    dialog.visible = true
  } finally {
    dialog.loading = false
  }
}

async function openImportDialog() {
  dialog.title = "导入"
  dialogImport.visible = true
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
  await getDataNameList()
  loading.value = false
})
</script>

<template>
  <div class="app-container">
    <!-- 查询表单 -->
    <el-card v-loading="loading" shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item prop="dataName" label="数据源">
          <el-select v-model="searchData.dataName" filterable clearable placeholder="请选择/输入数据源名称">
            <el-option key="" label="全部" value="" />
            <el-option v-for="item in dataNameList" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item prop="tableName" label="表名称">
          <el-input v-model="searchData.tableName" placeholder="请输入表名称" @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item prop="tableComment" label="表描述">
          <el-input v-model="searchData.tableComment" placeholder="请输入表描述" @keyup.enter="getTableData" />
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
    <DataTable
      v-model:loading="loading"
      v-model:table-data="tableData"
      v-model:pagination-data="paginationData"
      @open-import-dialog="openImportDialog"
      @get-table-data="getTableData"
      @handle-delete="handleDelete"
      @handle-update="handleUpdate"
      @handle-gen-table="handleGenTable"
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
            预览
          </el-button>
          <el-dropdown trigger="hover">
            <span class="el-dropdown-link">
              <el-icon color="#409EFF"><more-filled /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleUpdate(scope.row)" :disabled="!checkPermission(['tool:gen:edit'])">
                  <el-icon color="#409EFF">
                    <edit />
                  </el-icon>
                  修改
                </el-dropdown-item>
                <el-dropdown-item @click="handleDelete(scope.row)" :disabled="!checkPermission(['tool:gen:remove'])">
                  <el-icon color="#F56C6C">
                    <Delete />
                  </el-icon>
                  删除
                </el-dropdown-item>
                <el-dropdown-item @click="handleSynchDb(scope.row)" :disabled="!checkPermission(['tool:gen:edit'])">
                  <el-icon color="#409EFF">
                    <Refresh />
                  </el-icon>
                  同步
                </el-dropdown-item>
                <el-dropdown-item @click="handleGenTable(scope.row)" :disabled="!checkPermission(['tool:gen:code'])">
                  <el-icon color="#409EFF">
                    <Download />
                  </el-icon>
                  下载
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </template>
    </DataTable>

    <!-- 数据弹窗 -->
    <DataDialog
      v-model:dialog="dialog"
      v-model:form-data="formData"
      @success="getTableData"
    />

    <ImportDialog
      v-model:dialog="dialogImport"
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
