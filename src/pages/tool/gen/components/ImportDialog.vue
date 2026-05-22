<script lang="ts" setup>
import type { DbTableQuery, DbTableVO } from "@@/apis/tool/gen/types"
import type { FormActionEmits } from "types/common"
import { getSysGenDataNames, getSysGenDbListApi, importSysGenTable } from "@@/apis/tool/gen"
import { useDevice } from "@@/composables/useDevice.ts"
import { usePagination } from "@@/composables/usePagination.ts"
import { formatDateTime } from "@@/utils"
import { Refresh, Search } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"

const props = defineProps<{
  currentDataName?: string
}>()
const emit = defineEmits<FormActionEmits>()

const dialog = defineModel<DialogOption>("dialog", { required: true })

const { isMobile } = useDevice()
const tableData = ref<DbTableVO[]>([])
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const selectedRows = ref<DbTableVO[]>([])
const handleSelectionChange = (val: DbTableVO[]) => (selectedRows.value = val)

const searchData = reactive<DbTableQuery>({
  pageNum: 1,
  pageSize: 10,
  dataName: "",
  tableName: "",
  tableComment: ""
})
const searchFormRef = useTemplateRef("searchFormRef")

function resetSearch() {
  searchFormRef.value?.resetFields()
  getTableData()
}

const dataNameList = ref<string[]>([])
async function getDataNameList() {
  const res = await getSysGenDataNames()
  dataNameList.value = res.data || []
  searchData.dataName = props.currentDataName || dataNameList.value[0] || ""
}

async function getTableData(): Promise<void> {
  try {
    dialog.value.loading = true
    const { rows, total } = await getSysGenDbListApi({
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
    dialog.value.loading = false
  }
}

async function handleSubmit() {
  const tableNames = selectedRows.value.map(table => table.tableName).join(",")
  if (!tableNames) {
    ElMessage.error("请选择要导入的表")
    return
  }
  if (!searchData.dataName) {
    ElMessage.error("请选择数据源")
    return
  }
  dialog.value.loading = true
  try {
    await importSysGenTable({ tables: tableNames, dataName: searchData.dataName })
    ElMessage.success("导入成功")
    emit("success")
    dialog.value.visible = false
  } finally {
    dialog.value.loading = false
  }
}

function handleCancel() {
  resetSearch()
  selectedRows.value = []
  dialog.value.visible = false
  emit("cancel")
}

watch(() => dialog.value.visible, async (visible) => {
  if (visible) {
    selectedRows.value = []
    paginationData.currentPage = 1
    await getDataNameList()
    await getTableData()
  }
})

watch(
  [() => paginationData.currentPage, () => paginationData.pageSize],
  () => {
    if (dialog.value.visible) getTableData()
  }
)
</script>

<template>
  <el-dialog v-model="dialog.visible" :title="dialog.title" :width="isMobile ? '95%' : '1100px'">
    <el-card v-loading="dialog.loading" shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item prop="dataName" label="数据源">
          <el-select v-model="searchData.dataName" filterable placeholder="请选择/输入数据源名称">
            <el-option v-for="item in dataNameList" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item prop="tableName" label="表名称">
          <el-input v-model="searchData.tableName" placeholder="请输入表名称" @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item prop="tableComment" label="表描述">
          <el-input v-model="searchData.tableComment" placeholder="请输入表描述" @keyup.enter="getTableData" />
        </el-form-item>
        <el-button type="primary" :icon="Search" @click="getTableData">
          查询
        </el-button>
        <el-button :icon="Refresh" @click="resetSearch">
          重置
        </el-button>
      </el-form>

      <div class="table-wrapper">
        <el-table :data="tableData" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="tableName" label="表名称" align="center" min-width="160" :show-overflow-tooltip="true" />
          <el-table-column prop="tableComment" label="表描述" align="center" min-width="160" :show-overflow-tooltip="true" />
          <el-table-column label="创建时间" align="center" prop="createTime" min-width="180">
            <template #default="scope">
              <span>{{ formatDateTime(scope.row.createTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="更新时间" align="center" prop="updateTime" min-width="180">
            <template #default="scope">
              <span>{{ formatDateTime(scope.row.updateTime) }}</span>
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

      <template #footer>
        <el-button @click="handleCancel">
          取消
        </el-button>
        <el-button type="primary" @click="handleSubmit" :loading="dialog.loading" :disabled="selectedRows.length === 0">
          确认导入
        </el-button>
      </template>
    </el-card>
  </el-dialog>
</template>

<style lang="scss" scoped>
.search-wrapper {
  :deep(.el-card__body) {
    padding-bottom: 12px;
  }
}

.table-wrapper {
  margin-bottom: 20px;
}

.pager-wrapper {
  display: flex;
  justify-content: flex-end;
}
</style>
