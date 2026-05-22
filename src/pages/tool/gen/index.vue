<script lang="ts" setup>
import type { TableQuery, TableVO } from "@@/apis/tool/gen/types"
import { delSysGenTable, getSysGenDataNames, getSysGenListApi, previewSysGenTable, synchSysGenDb } from "@@/apis/tool/gen"
import { formatDateTime } from "@@/utils"
import { usePagination } from "@@/composables/usePagination.ts"
import { checkPermission } from "@@/utils/permission"
import { Delete, Refresh, Search } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { cloneDeep } from "lodash-es"
import { ref, watch } from "vue"
import { downloadZip } from "@/http/download"
import DataDialog from "./components/DataDialog.vue"
import DataTable from "./components/DataTable.vue"
import ImportDialog from "./components/ImportDialog.vue"

defineOptions({
  name: "ToolGen"
})

const router = useRouter()

const loading = ref(true)
const tableData = ref<TableVO[]>([])
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

const dialogImport = reactive<DialogOption>({
  title: "",
  visible: false,
  loading: false,
  isEditable: false
})

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const searchData = reactive<TableQuery>({
  pageNum: 1,
  pageSize: 10,
  tableName: "",
  tableComment: "",
  dataName: "",
  params: {}
})
const searchFormRef = useTemplateRef("searchFormRef")

const dateRange = ref<[DateModelType, DateModelType]>(["", ""])
watch(dateRange, ([beginTime, endTime]) => {
  searchData.params = {}
  if (beginTime && endTime) {
    searchData.params.beginTime = formatDateTime(beginTime)
    searchData.params.endTime = formatDateTime(endTime)
  }
})

function resetSearch() {
  searchFormRef.value?.resetFields()
  dateRange.value = ["", ""]
  getTableData()
}

const dataNameList = ref<string[]>([])
async function getDataNameList() {
  const res = await getSysGenDataNames()
  dataNameList.value = res.data || []
}

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
    paginationData.total = 0
  } finally {
    loading.value = false
  }
}

async function handleDelete(row: TableVO | TableVO[]) {
  const items = Array.isArray(row) ? row : [row]
  const tableIds = items.map(item => item.tableId)
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
    const res = await delSysGenTable(tableIds)
    ElMessage.success(res.msg)
    await getTableData()
  } catch {
  } finally {
    loading.value = false
  }
}

function handleUpdate(row: TableVO) {
  router.push({ path: `/tool/gen-edit/index/${row.tableId}`, query: { pageNum: paginationData.currentPage } })
}

function handleGenTable(row: TableVO | TableVO[]) {
  const currentRows = Array.isArray(row) ? row : [row]
  if (!currentRows.length) {
    ElMessage.error("请选择要生成的数据")
    return
  }
  const tableIds = currentRows.map(item => item.tableId).join(",")
  downloadZip(`/tool/gen/batchGenCode?tableIdStr=${tableIds}`, "ruoyi.zip")
}

async function handleSynchDb(row: TableVO) {
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
  await synchSysGenDb(row.tableId)
  loading.value = false
  ElMessage.success("同步成功")
  await getTableData()
}

async function openShowDialog(row: TableVO) {
  dialog.loading = true
  dialog.title = "代码预览"
  dialog.isEditable = false
  dialog.visible = true
  try {
    formData.value.data = cloneDeep({})
    const { data } = await previewSysGenTable(row.tableId)
    formData.value.data = data || {}
    formData.value.activeName = "domain.java"
  } finally {
    dialog.loading = false
  }
}

function openImportDialog() {
  dialogImport.title = "导入表"
  dialogImport.visible = true
}

watch(
  [() => paginationData.currentPage, () => paginationData.pageSize],
  () => {
    getTableData()
  }
)

onMounted(async () => {
  await getTableData()
  await getDataNameList()
})
</script>

<template>
  <div class="app-container">
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
            v-if="checkPermission(['tool:gen:preview'])"
          >
            预览
          </el-button>
          <el-dropdown trigger="hover">
            <span class="el-dropdown-link">
              <el-icon color="#409EFF"><more-filled /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleUpdate(scope.row)" v-if="checkPermission(['tool:gen:edit'])">
                  <el-icon color="#409EFF">
                    <edit />
                  </el-icon>
                  修改
                </el-dropdown-item>
                <el-dropdown-item @click="handleDelete(scope.row)" v-if="checkPermission(['tool:gen:remove'])">
                  <el-icon color="#F56C6C">
                    <Delete />
                  </el-icon>
                  删除
                </el-dropdown-item>
                <el-dropdown-item @click="handleSynchDb(scope.row)" v-if="checkPermission(['tool:gen:edit'])">
                  <el-icon color="#409EFF">
                    <Refresh />
                  </el-icon>
                  同步
                </el-dropdown-item>
                <el-dropdown-item @click="handleGenTable(scope.row)" v-if="checkPermission(['tool:gen:code'])">
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

    <DataDialog
      v-model:dialog="dialog"
      v-model:form-data="formData"
      @success="getTableData"
    />

    <ImportDialog
      v-model:dialog="dialogImport"
      :current-data-name="searchData.dataName"
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
