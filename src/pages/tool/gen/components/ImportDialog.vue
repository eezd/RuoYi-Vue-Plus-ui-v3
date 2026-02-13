<script lang="ts" setup>
import type { DbTableQuery, DbTableVO } from "@@/apis/tool/gen/types"
import type { FormActionEmits } from "types/common"
import { getSysGenDataNames, getSysGenDbListApi, importSysGenTable } from "@@/apis/tool/gen"
import { useDevice } from "@@/composables/useDevice.ts"
import { usePagination } from "@@/composables/usePagination.ts"
import { formatDateTime } from "@@/utils"
import { Refresh, Search } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"

const emit = defineEmits<FormActionEmits>()

/**
 * defineModel
 */
// #region defineModel
const dialog = defineModel<DialogOption>("dialog", { required: true })
// #endregion

const { isMobile } = useDevice()

const tableData = ref<DbTableVO[]>([])

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const selectedRows = ref<DbTableVO[]>([])
const handleSelectionChange = (val: DbTableVO[]) => (selectedRows.value = val)

// #region 搜索栏
const searchData = reactive({
  dataName: "",
  tableName: "",
  tableComment: ""
} as DbTableQuery)
const searchFormRef = useTemplateRef("searchFormRef")

function resetSearch() {
  searchFormRef.value?.resetFields()
  getTableData()
}
// #endregion

const dataNameList = ref<Array<string>>([])
/** 查询多数据源名称 */
async function getDataNameList(dataName?: string) {
  const res = await getSysGenDataNames()
  dataNameList.value = res.data
  if (dataName) {
    searchData.dataName = dataName
  } else {
    searchData.dataName = dataNameList.value[0]
  }
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
  } finally {
    dialog.value.loading = false
  }
}

async function handleSubmit() {
  const tableNames = selectedRows.value.map((table) => {
    return table.tableName
  }).join(",") || ""
  if (tableNames === "") {
    ElMessage.success("请选择要分配的表")
    return
  }
  dialog.value.loading = true
  await importSysGenTable({ tables: tableNames, dataName: searchData.dataName })
  ElMessage.success("分配成功")
  emit("success")
  dialog.value.loading = false
  dialog.value.visible = false
}

function handleCancel() {
  resetSearch()
  dialog.value.visible = false
  emit("cancel")
}

watch(() => dialog.value.visible, () => {
  if (dialog.value.visible) {
    getTableData()
    getDataNameList()
  }
})

watch(
  [() => paginationData.currentPage, () => paginationData.pageSize],
  () => {
    getTableData()
    getDataNameList()
  }
)
</script>

<template>
  <el-dialog v-model="dialog.visible" :title="dialog.title" :width="isMobile ? '95%' : '820px'">
    <!-- 查询表单 -->
    <el-card v-loading="dialog.loading" shadow="never" class="search-wrapper">
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
          <el-table-column prop="tableName" label="表名称" align="center" min-width="100" />
          <el-table-column prop="tableComment" label="表描述" align="center" min-width="100" />
          <el-table-column label="创建时间" align="center" prop="createTime" min-width="160">
            <template #default="scope">
              <span>{{ formatDateTime(scope.row.createTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="更新时间" align="center" prop="updateTime" min-width="160">
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
          确认表
        </el-button>
      </template>
    </el-card>
  </el-dialog>
</template>

<style lang="scss" scoped>
.table-wrapper {
  margin-bottom: 20px;
}

.pager-wrapper {
  display: flex;
  justify-content: flex-end;
}
</style>
