<script lang="ts" setup>
import type { DemoForm, DemoQuery } from "@@/apis/system/demo/types.ts"
import type { FormInstance } from "element-plus"
import { delSysDemoApi, getSysDemoApi, getSysDemoListApi } from "@@/apis/system/demo"
import { usePagination } from "@@/composables/usePagination.ts"
import { checkPermission } from "@@/utils/permission"
import { Delete, Refresh, Search } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { cloneDeep } from "lodash-es"
import { ref, watch } from "vue"
import { download } from "@/http/download"
import DataDialog from "./components/DataDialog.vue"
import DataTable from "./components/DataTable.vue"

defineOptions({
  name: "AdminSysDemo"
})

const loading = ref(true)

// 表格数据
const tableData = ref<DemoForm[]>([])
const DEFAULT_FORM_DATA: Partial<DemoForm> = {
  deptId: 0,
  userId: 0,
  orderNum: 0,
  testKey: "",
  value: ""
}
// 表单数据
const formData = ref<Partial<DemoForm>>(cloneDeep(DEFAULT_FORM_DATA))
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
  deptId: undefined,
  userId: undefined,
  orderNum: undefined,
  testKey: undefined,
  value: undefined,
  params: {
  }
} as DemoQuery)
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
    const { rows, total } = await getSysDemoListApi({
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
async function handleDelete(row: DemoForm | DemoForm[]) {
  const items = Array.isArray(row) ? row : [row]
  const deleteIds = items.map(item => item.id)
  const message = Array.isArray(row)
    ? `正在删除 ${row.length} 条数据，确认删除？`
    : `正在删除：${row.id}，确认删除？`

  try {
    await ElMessageBox.confirm(message, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
    loading.value = true
    const res = await delSysDemoApi(deleteIds)
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
    "system/demo/export",
    { ...searchData },
    `demo_${new Date().getTime()}.xlsx`
  )
}
// #endregion

// #region 弹窗操作
/**
 * 统一处理数据弹窗
 *
 * @param type 操作类型,支持 "add"(新增)、"edit"(编辑)、"show"(查看)
 * @param row 可选参数,编辑或查看时传入对应的菜单项
 */
async function handleOpenDialog(type: "add" | "edit" | "show", row?: DemoForm) {
  dialog.visible = true
  dialog.isEditable = type !== "show"
  dialog.title = { add: "新增", edit: "修改", show: "查看" }[type]

  formData.value = cloneDeep(DEFAULT_FORM_DATA)

  if ((type === "edit" || type === "show") && row) {
    dialog.loading = true
    try {
      const { data } = await getSysDemoApi(row.id)
      Object.assign(formData.value, data)
    } finally {
      dialog.loading = false
    }
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
        <el-form-item label="部门id" prop="deptId">
          <el-input v-model="searchData.deptId" placeholder="请输入部门id" clearable @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item label="用户id" prop="userId">
          <el-input v-model="searchData.userId" placeholder="请输入用户id" clearable @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item label="排序号" prop="orderNum">
          <el-input v-model="searchData.orderNum" placeholder="请输入排序号" clearable @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item label="key键" prop="testKey">
          <el-input v-model="searchData.testKey" placeholder="请输入key键" clearable @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item label="值" prop="value">
          <el-input v-model="searchData.value" placeholder="请输入值" clearable @keyup.enter="getTableData" />
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
      @open-add-dialog="handleOpenDialog('add')"
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
            @click="handleOpenDialog('show', scope.row)"
          >
            查看
          </el-button>
          <el-dropdown trigger="hover">
            <span class="el-dropdown-link">
              <el-icon color="#409EFF"><more-filled /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleOpenDialog('edit', scope.row)" v-if="checkPermission(['system:demo:edit'])">
                  <el-icon color="#409EFF">
                    <edit />
                  </el-icon>
                  修改
                </el-dropdown-item>
                <el-dropdown-item @click="handleDelete(scope.row)" v-if="checkPermission(['system:demo:remove'])">
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
    </DataTable>

    <!-- 数据弹窗 -->
    <DataDialog
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
